import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
        apiVersion: '2024-12-18.accredited' as any,
      });
    }
  }

  async createCheckoutSession(amount: number, orderId: number, currency = 'inr'): Promise<any> {
    if (!this.stripe) {
      throw new InternalServerErrorException('Stripe service is not configured. Payments are disabled.');
    }
    try {
      const frontendUrl = this.configService.get<string>('frontendUrl') || 'http://localhost:3000';
      const locale = 'en'; // Default locale
      
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: `Beauty Parlé Order #${orderId}`,
              },
              unit_amount: Math.round(amount * 100), // in cents
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

    // Update order status to paid and assign the Stripe payment ID
    order.status = 'paid';
    order.paymentId = (session.payment_intent as string) || session.id;
    await this.orderRepo.save(order);
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
