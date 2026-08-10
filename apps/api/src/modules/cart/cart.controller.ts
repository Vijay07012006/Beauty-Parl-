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

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token);
        if (payload?.sub) userId = Number(payload.sub);
      } catch (err) {
        // Token invalid or expired — treat as guest
      }
    }

    return this.cartService.syncCart(userId, body.email, body.items);
  }
}
