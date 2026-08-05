import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException, Req, Res } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';

@Controller('payments')
export class PaymentsController {
  constructor(private razorpayService: RazorpayService) {}

  @Post('create-order')
  @HttpCode(HttpStatus.OK)
  async createOrder(@Body() body: { amount: number; orderId?: number }) {
    if (body.amount === undefined || body.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    return this.razorpayService.createOrder(body.amount, body.orderId);
  }

  @Post('webhook')
  async webhook(@Req() req: any, @Res() res: any) {
    const body = req.body;
    const signature = req.headers['x-razorpay-signature'] as string;
    
    if (!signature) {
      return res.status(HttpStatus.BAD_REQUEST).send('Missing signature header');
    }

    const isValid = await this.razorpayService.verifyWebhook(body, signature);
    if (!isValid) {
      return res.status(HttpStatus.BAD_REQUEST).send('Invalid signature');
    }

    // Process webhook event
    const event = body.event;
    if (event === 'payment.captured') {
      await this.razorpayService.handlePaymentSuccess(body);
    }

    return res.status(HttpStatus.OK).send('OK');
  }
}
