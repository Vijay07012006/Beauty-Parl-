import { Controller, Get, Post, Put, Delete, Body, Param, Headers, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subService: SubscriptionsService,
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
    @Body() body: { productId: number; frequency: 'monthly' | 'quarterly' | 'bi-monthly'; quantity: number; paymentMethod?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = this.extractUserId(authHeader);

    // Subscriptions must be backed by a prepaid payment method — COD is not accepted (Fix 21)
    const method = (body.paymentMethod || '').toLowerCase();
    if (!method) {
      throw new BadRequestException('A payment method is required to create a subscription');
    }
    if (method === 'cod' || method === 'cash_on_delivery') {
      throw new BadRequestException('COD is not supported for subscriptions. Please use a prepaid payment method.');
    }

    return this.subService.create(body.productId, body.frequency, body.quantity || 1, userId, method);
  }

  @Get()
  async list(@Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);
    return this.subService.list(userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { frequency: 'monthly' | 'quarterly' | 'bi-monthly'; quantity: number },
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.subService.update(Number(id), body.frequency, body.quantity, userId);
  }

  @Delete(':id')
  async cancel(@Param('id') id: string, @Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);
    await this.subService.cancel(Number(id), userId);
    return { success: true };
  }
}
