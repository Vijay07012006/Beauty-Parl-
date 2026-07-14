import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor(private configService: ConfigService) {
    const keyId = this.configService.get<string>('razorpay.keyId');
    const keySecret = this.configService.get<string>('razorpay.keySecret');

    if (!keyId || !keySecret) {
      throw new Error('Razorpay credentials are not defined in configurations');
    }

    this.razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }

  async createOrder(amount: number, currency = 'INR'): Promise<any> {
    try {
      const options = {
        amount: Math.round(amount * 100), // paise
        currency,
        receipt: `receipt_order_${Date.now()}`,
      };
      const order = await this.razorpay.orders.create(options);
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
}
