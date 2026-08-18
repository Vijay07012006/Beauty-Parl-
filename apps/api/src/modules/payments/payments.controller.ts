import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { RazorpayService } from './razorpay.service';
import { StripeService } from './stripe.service';
import { OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(
    private razorpayService: RazorpayService,
    private stripeService: StripeService,
  ) {}

  // H-7: payment orders may only be created for the caller's own order —
  // authenticated users are bound by their id, guests must prove ownership of the guest email.
  @Post('create-order')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createOrder(
    @Req() req: Request,
    @Body() body: { amount: number; orderId?: number; email?: string },
  ) {
    if (!body.orderId) {
      throw new BadRequestException('Order ID is required');
    }
    if (body.amount === undefined || body.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    const userId = (req.user as { id?: number })?.id;
    const guestEmail = userId ? undefined : body.email?.trim().toLowerCase();
    return this.razorpayService.createOrder(
      body.amount,
      body.orderId,
      'INR',
      userId,
      guestEmail,
    );
  }

  @Post('webhook')
  async webhook(@Req() req: any, @Res() res: any) {
    const body = req.body;
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Missing signature header');
    }

    // Verify against the RAW body — re-serializing the parsed JSON would break the signature (Fix 15)
    const isValid = await this.razorpayService.verifyWebhook(
      req.rawBody,
      signature,
    );
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
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createStripeSession(
    @Req() req: Request,
    @Body() body: { amount: number; orderId: number; email?: string },
  ) {
    if (!body.orderId) {
      throw new BadRequestException('OrderId is required');
    }
    if (!body.amount || body.amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }
    const userId = (req.user as { id?: number })?.id;
    const guestEmail = userId ? undefined : body.email?.trim().toLowerCase();
    return this.stripeService.createCheckoutSession(
      body.amount,
      body.orderId,
      userId,
      guestEmail,
    );
  }

  @Post('stripe-webhook')
  async stripeWebhook(@Req() req: any, @Res() res: any) {
    const signature = req.headers['stripe-signature'] as string;
    if (!signature) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send('Missing stripe-signature header');
    }

    // Parse the webhook event using the raw body
    let event: any;
    try {
      event = await this.stripeService.verifyWebhook(req.rawBody, signature);
    } catch (err: any) {
      console.error(
        '⚠️ Stripe webhook signature verification failed:',
        err.message,
      );
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      await this.stripeService.handlePaymentSuccess(session);
    }

    return res.status(HttpStatus.OK).send({ received: true });
  }
}
