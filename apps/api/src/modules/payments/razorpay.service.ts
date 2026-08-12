import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { Order } from '../orders/order.entity';
import { EmailService } from '../email/email.service';
import { User } from '../auth/user.entity';

@Injectable()
export class RazorpayService {
  private razorpay?: Razorpay;

  constructor(
    private configService: ConfigService,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private emailService: EmailService,
  ) {
    const keyId = this.configService.get<string>('razorpay.keyId');
    const keySecret = this.configService.get<string>('razorpay.keySecret');

    if (!keyId || !keySecret) {
      console.warn('⚠️ [Payments] Razorpay credentials are not defined. Payments using Razorpay will fail.');
    } else {
      this.razorpay = new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
      });
    }
  }

  async createOrder(amount: number, orderId?: number, currency = 'INR', userId?: number, guestEmail?: string): Promise<any> {
    if (!this.razorpay) {
      throw new InternalServerErrorException('Razorpay service is not configured. Payments are disabled.');
    }
    if (!orderId) {
      throw new BadRequestException('Order ID is required to create a payment order');
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
      const options = {
        amount: Math.round(Number(dbOrder.total) * 100), // paise
        currency,
        receipt: `receipt_order_${orderId}`,
      };
      const order = await this.razorpay.orders.create(options);

      // Save the generated razorpayOrderId in the database order record
      await this.orderRepo.update(orderId, { razorpayOrderId: order.id });

      return {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: this.configService.get<string>('razorpay.keyId'),
      };
    } catch (error: any) {
      throw new InternalServerErrorException(error.message || 'Razorpay order generation failed.');
    }
  }

  // Verify webhook signature against the RAW request body
  async verifyWebhook(body: Buffer | string, signature: string): Promise<boolean> {
    // Webhook secret must be its own dedicated secret — never silently fall back to the API keySecret (O10)
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    if (!webhookSecret) {
      console.error('[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured. Webhooks will be rejected.');
      return false;
    }
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    // M-5: constant-time comparison to avoid timing side channels
    const expectedBuf = Buffer.from(expectedSignature, 'hex');
    const receivedBuf = Buffer.from(signature || '', 'hex');
    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  }

  // Handle payment success webhook
  async handlePaymentSuccess(paymentData: any) {
    const payment = paymentData.payload.payment.entity;
    const razorpayOrderId = payment.order_id;
    const paymentId = payment.id;

    if (!razorpayOrderId) {
      console.warn('⚠️ [Webhook] No order_id found in payment capture entity.');
      return;
    }

    const order = await this.orderRepo.findOne({ where: { razorpayOrderId } });
    if (!order) {
      console.warn(`⚠️ [Webhook] No order found with razorpayOrderId: ${razorpayOrderId}`);
      return;
    }

    if (order.status === 'paid') {
      console.log(`[Webhook] Order #${order.id} is already paid. Skipping.`);
      return;
    }

    // Server-side: verify the paid amount matches the order total (amount is in paise)
    const expectedAmountPaise = Math.round(Number(order.total) * 100);
    if (payment.amount !== expectedAmountPaise) {
      console.warn(
        `[Webhook] Amount mismatch for order #${order.id}: expected ${expectedAmountPaise} paise, received ${payment.amount} paise. Skipping.`,
      );
      return;
    }
    // M-5: enforce the order currency (INR) — reject payments settled in any other currency
    if (payment.currency && payment.currency.toUpperCase() !== 'INR') {
      console.warn(
        `[Webhook] Currency mismatch for order #${order.id}: expected INR, received ${payment.currency}. Skipping.`,
      );
      return;
    }

    // Idempotent transition — only mark paid once (prevents duplicate processing on retries)
    const updated = await this.orderRepo
      .createQueryBuilder()
      .update(Order)
      .set({ status: 'paid', paymentId })
      .where('id = :id AND status != :paid', { id: order.id, paid: 'paid' })
      .execute();

    if (!updated.affected || updated.affected === 0) {
      console.log(`✅ [Webhook] Order #${order.id} already marked paid. Skipping.`);
      return;
    }
    order.status = 'paid';
    order.paymentId = paymentId;
    console.log(`✅ [Webhook] Order #${order.id} updated to 'paid'.`);

    // Send confirmation email
    const email = order.guestEmail || (order.userId ? await this.getUserEmail(order.userId) : null);
    if (email) {
      try {
        await this.emailService.sendOrderConfirmation(email, order);
        console.log(`📧 [Webhook] Confirmation email sent to ${email} for Order #${order.id}`);
      } catch (err) {
        console.error(`❌ [Webhook] Failed to send confirmation email for Order #${order.id}:`, err);
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
