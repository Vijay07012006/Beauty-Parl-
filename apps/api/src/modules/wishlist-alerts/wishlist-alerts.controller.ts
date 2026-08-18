import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { WishlistAlertsService } from './wishlist-alerts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('wishlist-alerts')
@UseGuards(JwtAuthGuard)
export class WishlistAlertsController {
  constructor(private readonly alertsService: WishlistAlertsService) {}

  @Post()
  async create(
    @Body()
    body: {
      productId: number;
      alertType: 'price_drop' | 'back_in_stock';
      priceThreshold?: number;
    },
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: number }).id;
    return this.alertsService.create(
      body.productId,
      body.alertType,
      body.priceThreshold,
      userId,
    );
  }

  @Get()
  async list(@Req() req: Request) {
    const userId = (req.user as { id: number }).id;
    return this.alertsService.list(userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as { id: number }).id;
    await this.alertsService.delete(Number(id), userId);
    return { success: true };
  }
}
