import { Controller, Post, Body, Headers } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly jwtService: JwtService,
  ) {}

  @Post()
  async syncCart(
    @Body() body: { items: any[]; email?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    let userId: number | undefined;
    let tokenEmail: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token);
        if (payload?.sub) userId = Number(payload.sub);
        if (payload?.email) tokenEmail = String(payload.email);
      } catch (err) {
        // Token invalid or expired — treat as guest
      }
    }

    // A client-supplied email may only be used to key a guest cart if it matches the authenticated user.
    // Otherwise drop it — prevents email squatting / claiming another user's abandoned cart.
    let email: string | undefined;
    if (tokenEmail) {
      email = tokenEmail;
    } else if (userId) {
      email = undefined;
    } else {
      email = undefined; // Anonymous guests do not get an email-keyed cart
    }

    return this.cartService.syncCart(userId, email, Array.isArray(body.items) ? body.items : []);
  }
}
