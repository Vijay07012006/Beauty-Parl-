import { Controller, Post, Body, HttpCode, HttpStatus, BadRequestException, Req, Res } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { StripeService } from './stripe.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private razorpayService: RazorpayService,
    private stripeService: StripeService,
  ) {}

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

    // Verify against the RAW body — re-serializing the parsed JSON would break the signature (Fix 15)
    const isValid = await this.razorpayService.verifyWebhook(req.rawBody, signature);
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

  @Post('create-stripe-session')
  @HttpCode(HttpStatus.OK)
  async createStripeSession(@Body() body: { amount: number; orderId: number }) {
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    if (!body.orderId) {
      throw new BadRequestException('OrderId is required');
    }
    return this.stripeService.createCheckoutSession(body.amount, body.orderId);
  }

  @Post('stripe-webhook')
  async stripeWebhook(@Req() req: any, @Res() res: any) {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return res.status(HttpStatus.BAD_REQUEST).send('Missing stripe-signature header');
    }

    // Parse the webhook event using the raw body
    let event: any;
    try {
      event = await this.stripeService.verifyWebhook(req.rawBody, signature);
    } catch (err: any) {
      console.error('⚠️ Stripe webhook signature verification failed:', err.message);
      return res.status(HttpStatus.BAD_REQUEST).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await this.stripeService.handlePaymentSuccess(session);
    }

    return res.status(HttpStatus.OK).send({ received: true });
  }
}
