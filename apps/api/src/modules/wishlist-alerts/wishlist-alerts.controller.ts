import { Controller, Get, Post, Delete, Param, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WishlistAlertsService } from './wishlist-alerts.service';

@Controller('wishlist-alerts')
export class WishlistAlertsController {
  constructor(
    private readonly alertsService: WishlistAlertsService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(authHeader?: string): number {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token missing or invalid');
    }
    try {
      const token = authHeader.split(' ')[1];
      const payload = this.jwtService.verify(token);
      if (payload?.sub) return Number(payload.sub);
    } catch {}
    throw new UnauthorizedException('Authentication token signature verification failed');
  }

  @Post()
  async create(
    @Body() body: { productId: number; alertType: 'price_drop' | 'back_in_stock'; priceThreshold?: number },
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.alertsService.create(body.productId, body.alertType, body.priceThreshold, userId);
  }

  @Get()
  async list(@Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);
    return this.alertsService.list(userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);
    await this.alertsService.delete(Number(id), userId);
    return { success: true };
  }
}
