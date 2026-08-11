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

  async createOrder(amount: number, orderId?: number, currency = 'INR'): Promise<any> {
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
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || this.configService.get<string>('razorpay.keySecret') || '';
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');
    return expectedSignature === signature;
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

    // Update order status to paid and assign the Razorpay payment ID
    order.status = 'paid';
    order.paymentId = paymentId;
    await this.orderRepo.save(order);
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
