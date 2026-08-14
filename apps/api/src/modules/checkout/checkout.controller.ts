import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { OneClickCheckoutService } from './one-click-checkout.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('checkout')
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly checkoutService: OneClickCheckoutService) {}

  @Post('save-payment')
  async savePayment(
    @Request() req: any,
    @Body() body: { cardId: string; last4: string; brand: string; expiry: string },
  ) {
    const userId = Number(req.user.id);
    return this.checkoutService.savePaymentMethod(userId, body);
  }

  @Get('saved-payments')
  async getSavedPayments(@Request() req: any) {
    const userId = Number(req.user.id);
    return this.checkoutService.getSavedPaymentMethods(userId);
  }

  @Post('one-click')
  async oneClickCheckout(
    @Request() req: any,
    @Body()
    body: {
      savedMethodId: string;
      items: any[];
      shippingAddress: any;
      couponCode?: string;
      discount?: number;
      pointsRedeemed?: number;
    },
  ) {
    const userId = Number(req.user.id);
    return this.checkoutService.oneClickCheckout(userId, body);
  }
}
