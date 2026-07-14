import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Request, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  // Dashboard Stats
  @Get('stats')
  async getStats() {
    const totalUsers = await this.userRepo.count();
    const totalProducts = await this.productRepo.count();
    const totalOrders = await this.orderRepo.count();
    const pendingOrders = await this.orderRepo.count({ where: { status: 'pending' } });
    
    const revenueResult = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .where('order.status = :status', { status: 'delivered' })
      .getRawOne();

    return {
      users: totalUsers,
      products: totalProducts,
      orders: totalOrders,
      pendingOrders,
      revenue: parseFloat(revenueResult?.total || '0'),
    };
  }

  // Users Management
  @Get('users')
  async getUsers(@Query('page') page = 1, @Query('limit') limit = 10) {
    const [users, total] = await this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { users: users.map(({ password, ...u }) => u), total, page, limit };
  }

  @Put('users/:id/role')
  async updateUserRole(@Param('id') id: number, @Body() body: { role: UserRole }) {
    await this.userRepo.update(id, { role: body.role });
    return { success: true };
  }

  @Put('users/:id/status')
  async updateUserStatus(@Param('id') id: number, @Body() body: { isActive: boolean }) {
    await this.userRepo.update(id, { isActive: body.isActive });
    return { success: true };
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: number, @Request() req: any) {
    if (req.user && req.user.id === Number(id)) {
      throw new BadRequestException('You cannot delete your own account.');
    }
    await this.userRepo.delete(id);
    return { success: true };
  }

  // Products Management (Admin override)
  @Post('products')
  async createProduct(@Body() data: Partial<Product>) {
    const product = this.productRepo.create(data);
    return this.productRepo.save(product);
  }

  @Put('products/:id')
  async updateProduct(@Param('id') id: number, @Body() data: Partial<Product>) {
    await this.productRepo.update(id, data);
    return this.productRepo.findOne({ where: { id } });
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: number) {
    await this.productRepo.delete(id);
    return { success: true };
  }

  // Orders Management
  @Get('orders')
  async getOrders(@Query('page') page = 1, @Query('limit') limit = 10) {
    const [orders, total] = await this.orderRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { orders, total, page, limit };
  }

  @Put('orders/:id/status')
  async updateOrderStatus(@Param('id') id: number, @Body() body: { status: any }) {
    await this.orderRepo.update(id, { status: body.status });
    return { success: true };
  }

  @Get('orders/:id')
  async getOrderDetail(@Param('id') id: number) {
    return this.orderRepo.findOne({ where: { id } });
  }
}
