import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Stripe from 'stripe';
import { Order } from '../orders/order.entity';
import { EmailService } from '../email/email.service';
import { User } from '../auth/user.entity';

@Injectable()
export class StripeService {
  private stripe?: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private emailService: EmailService,
  ) {
    const secretKey = this.configService.get<string>('stripe.secretKey');
    if (!secretKey) {
      console.warn('⚠️ [Payments] Stripe Secret Key is not defined. Stripe payments will fail.');
    } else {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-02-24.acacia' as any,
      });
    }
  }

  async createCheckoutSession(amount: number, orderId: number, userId?: number, guestEmail?: string): Promise<any> {
    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe service is not configured. Payments are disabled.');
    }
    // Server-side: verify the order exists and the amount matches the order total (prevents price tampering)
    const dbOrder = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!dbOrder) {
      throw new BadRequestException(`Order with ID ${orderId} not found`);
    }
    // H-7: ownership — the caller must own the order (their userId OR the guest email on the order)
    const orderBelongsToUser = dbOrder.userId && userId && dbOrder.userId === userId;
    const orderBelongsToGuest = !dbOrder.userId && guestEmail && dbOrder.guestEmail?.toLowerCase() === guestEmail;
    if (!orderBelongsToUser && !orderBelongsToGuest) {
      throw new BadRequestException('You are not authorized to pay for this order');
    }
    if (Math.abs(Number(dbOrder.total) - Number(amount)) > 0.01) {
      throw new BadRequestException('Amount does not match the order total');
    }
    try {
      const frontendUrl = this.configService.get<string>('frontendUrl') || 'http://localhost:3000';
      const locale = 'en'; // Default locale

      // Currency is fixed server-side (INR) — the client cannot influence it (O10)
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'inr',
              product_data: {
                name: `Beauty Parlé Order #${orderId}`,
              },
              unit_amount: Math.round(Number(dbOrder.total) * 100), // in paise/cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${frontendUrl}/${locale}/order-confirmation/${orderId}?payment=success&email={CHECKOUT_SESSION_CUSTOMER_EMAIL}`,
        cancel_url: `${frontendUrl}/${locale}/checkout`,
        metadata: {
          orderId: orderId.toString(),
        },
      });

      return {
        id: session.id,
        url: session.url,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message || 'Stripe checkout session generation failed.');
    }
  }

  async verifyWebhook(rawBody: Buffer, signature: string): Promise<Stripe.Event> {
    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe service is not configured.');
    }
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret') || '';
    return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }

  async handlePaymentSuccess(session: Stripe.Checkout.Session) {
    const orderIdStr = session.metadata?.orderId;
    if (!orderIdStr) {
      console.warn('⚠️ [Stripe Webhook] No orderId found in session metadata.');
      return;
    }
    const orderId = Number(orderIdStr);
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      console.warn(`⚠️ [Stripe Webhook] No order found with id: ${orderId}`);
      return;
    }

    if (order.status === 'paid') {
      console.log(`[Stripe Webhook] Order #${order.id} is already paid. Skipping.`);
      return;
    }

    // Fail closed: only accept fully-paid sessions (O10)
    if (session.payment_status !== 'paid') {
      console.warn(`[Stripe Webhook] Session for order #${order.id} has payment_status '${session.payment_status}'. Skipping.`);
      return;
    }

    // Server-side: currency must match INR (O10)
    if (session.currency && session.currency.toLowerCase() !== 'inr') {
      console.warn(`[Stripe Webhook] Currency mismatch for order #${order.id}: ${session.currency}. Skipping.`);
      return;
    }

    // Fail closed: if amount_total is absent we cannot verify — reject (O10)
    if (typeof session.amount_total !== 'number') {
      console.warn(`[Stripe Webhook] Missing amount_total for order #${order.id}. Skipping.`);
      return;
    }

    // Server-side: verify the paid amount matches the order total (Stripe amount_total is in cents)
    const expectedAmountCents = Math.round(Number(order.total) * 100);
    if (session.amount_total !== expectedAmountCents) {
      console.warn(
        `[Stripe Webhook] Amount mismatch for order #${order.id}: expected ${expectedAmountCents} cents, received ${session.amount_total} cents. Skipping.`,
      );
      return;
    }

    // Idempotent transition — only mark paid once (prevents duplicate processing)
    const updated = await this.orderRepo
      .createQueryBuilder()
      .update(Order)
      .set({ status: 'paid', paymentId: (session.payment_intent as string) || session.id })
      .where('id = :id AND status != :paid', { id: order.id, paid: 'paid' })
      .execute();

    if (!updated.affected || updated.affected === 0) {
      console.log(`[Stripe Webhook] Order #${order.id} already processed. Skipping.`);
      return;
    }
    order.status = 'paid';
    order.paymentId = (session.payment_intent as string) || session.id;
    console.log(`✅ [Stripe Webhook] Order #${order.id} updated to 'paid'.`);

    // Send confirmation email
    const email = order.guestEmail || (order.userId ? await this.getUserEmail(order.userId) : null);
    if (email) {
      try {
        await this.emailService.sendOrderConfirmation(email, order);
        console.log(`📧 [Stripe Webhook] Confirmation email sent to ${email} for Order #${order.id}`);
      } catch (err) {
        console.error(`❌ [Stripe Webhook] Failed to send confirmation email for Order #${order.id}:`, err);
      }
    }
  }

  private async getUserEmail(userId: number): Promise<string | null> {
    if (!userId) return null;
    const userRepo = this.orderRepo.manager.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    return user?.email || null;
  }
}
