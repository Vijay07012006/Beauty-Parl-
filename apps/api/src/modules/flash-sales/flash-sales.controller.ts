import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { FlashSalesService } from './flash-sales.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('flash-sales')
export class FlashSalesController {
  constructor(private readonly flashSalesService: FlashSalesService) {}

  @Get('active')
  async getActiveSales() {
    return this.flashSalesService.getActiveFlashSales();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async create(
    @Body()
    body: {
      name: string;
      description?: string;
      discountPercentage: number;
      startTime: string;
      endTime: string;
      productIds: number[];
    },
  ) {
    return this.flashSalesService.createFlashSale({
      name: body.name,
      description: body.description,
      discountPercentage: body.discountPercentage,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      productIds: body.productIds,
    });
  }
}
