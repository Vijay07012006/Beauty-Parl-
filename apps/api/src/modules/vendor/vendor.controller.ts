import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { VendorService } from './vendor.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller()
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Post('vendor/register')
  @UseGuards(JwtAuthGuard)
  async register(
    @Req() req: any,
    @Body() body: { storeName: string; businessRegNumber: string },
  ) {
    const userId = Number(req.user.id);
    return this.vendorService.registerVendor(userId, body.storeName, body.businessRegNumber);
  }

  @Get('vendor/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async getProducts(@Req() req: any) {
    const userId = Number(req.user.id);
    const vendor = await this.vendorService.findVendorByUserId(userId);
    if (!vendor || vendor.status !== 'approved') {
      throw new ForbiddenException('Vendor account is not approved yet.');
    }
    return this.vendorService.listVendorProducts(vendor.id);
  }

  @Post('vendor/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VENDOR)
  async createProduct(
    @Req() req: any,
    @Body() body: { name: string; description: string; price: number; mrp?: number; discountPercent?: number; image?: string; category?: string; stock: number; brand?: string },
  ) {
    const userId = Number(req.user.id);
    const vendor = await this.vendorService.findVendorByUserId(userId);
    if (!vendor || vendor.status !== 'approved') {
      throw new ForbiddenException('Vendor account is not approved yet.');
    }
    return this.vendorService.createVendorProduct(vendor.id, body);
  }

  @Get('admin/vendors')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getVendors() {
    return this.vendorService.listVendors();
  }

  @Post('admin/vendors/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async approveVendor(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected' },
  ) {
    return this.vendorService.updateVendorStatus(Number(id), body.status);
  }
}
