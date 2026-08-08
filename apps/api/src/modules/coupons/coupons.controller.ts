import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  // ========== Public Routes ==========

  @Post('validate')
  async validateCoupon(
    @Body() body: { code: string; orderTotal: number },
  ) {
    return this.couponsService.validateCoupon(body.code, body.orderTotal);
  }

  // ========== Admin Routes ==========

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getCoupons(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    return this.couponsService.getCoupons(pageNum, limitNum);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getCouponStats() {
    return this.couponsService.getCouponStats();
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getCoupon(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.getCoupon(id);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createCoupon(@Body() data: any) {
    return this.couponsService.createCoupon(data);
  }

  @Put('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateCoupon(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.couponsService.updateCoupon(id, data);
  }

  @Put('admin/:id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async toggleCoupon(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.toggleCoupon(id);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteCoupon(@Param('id', ParseIntPipe) id: number) {
    return this.couponsService.deleteCoupon(id);
  }
}
