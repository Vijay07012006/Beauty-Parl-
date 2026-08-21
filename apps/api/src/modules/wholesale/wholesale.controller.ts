import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { WholesaleService } from './wholesale.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('wholesale')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.VENDOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class WholesaleController {
  constructor(private readonly wholesaleService: WholesaleService) {}

  @Get('suggestions')
  async getSuggestions(@Req() req: any) {
    const vendorId = Number(req.user.id);
    return this.wholesaleService.generateBulkSuggestion(vendorId);
  }

  @Get('orders')
  async getOrders(@Req() req: any) {
    const vendorId = Number(req.user.id);
    return this.wholesaleService.listWholesaleOrders(vendorId);
  }

  @Post('order')
  async createOrder(
    @Req() req: any,
    @Body() body: { items: { productId: number; quantity: number }[] },
  ) {
    const vendorId = Number(req.user.id);
    return this.wholesaleService.createWholesaleOrder(vendorId, body.items);
  }
}
