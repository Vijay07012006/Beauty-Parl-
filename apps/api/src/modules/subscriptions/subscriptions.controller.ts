import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subService: SubscriptionsService) {}

  @Post()
  async create(
    @Body()
    body: {
      productId: number;
      frequency: 'monthly' | 'quarterly' | 'bi-monthly';
      quantity: number;
      paymentMethod?: string;
    },
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: number }).id;

    // Subscriptions must be backed by a prepaid payment method — COD is not accepted (Fix 21)
    const method = (body.paymentMethod || '').toLowerCase();
    if (!method) {
      throw new BadRequestException(
        'A payment method is required to create a subscription',
      );
    }
    if (method === 'cod' || method === 'cash_on_delivery') {
      throw new BadRequestException(
        'COD is not supported for subscriptions. Please use a prepaid payment method.',
      );
    }

    return this.subService.create(
      body.productId,
      body.frequency,
      body.quantity || 1,
      userId,
      method,
    );
  }

  @Get()
  async list(@Req() req: Request) {
    const userId = (req.user as { id: number }).id;
    return this.subService.list(userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      frequency: 'monthly' | 'quarterly' | 'bi-monthly';
      quantity: number;
    },
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: number }).id;
    return this.subService.update(
      Number(id),
      body.frequency,
      body.quantity,
      userId,
    );
  }

  @Delete(':id')
  async cancel(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as { id: number }).id;
    await this.subService.cancel(Number(id), userId);
    return { success: true };
  }
}
