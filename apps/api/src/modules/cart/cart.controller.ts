import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { CartService } from './cart.service';
import { OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
  ) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async syncCart(
    @Body() body: { items: any[]; email?: string },
    @Req() req: Request,
  ) {
    const user = req.user as { id?: number; email?: string } | undefined;
    const userId = user?.id;

    // A client-supplied email may only be used to key a guest cart if it matches the authenticated user.
    // Otherwise drop it — prevents email squatting / claiming another user's abandoned cart.
    let email: string | undefined;
    if (user?.email) {
      email = user.email;
    } else {
      email = undefined; // Anonymous guests do not get an email-keyed cart
    }

    return this.cartService.syncCart(userId, email, Array.isArray(body.items) ? body.items : []);
  }
}