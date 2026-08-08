import { Controller, Post, Body, Get, Param, Put, NotFoundException, UseGuards, Request, ForbiddenException, BadRequestException, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  async create(@Body() orderData: Partial<Order>): Promise<Order> {
    return this.ordersService.create(orderData);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getMyOrders(
    @Request() req: any,
    @Query('status') status?: string,
  ): Promise<Order[]> {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN) {
      return this.ordersService.findAll(status);
    }

    return this.ordersService.findByUser(userId, status);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id') id: number,
    @Request() req: any,
    @Query('email') email?: string,
  ): Promise<Order> {
    const order = await this.ordersService.findOne(id);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    
    if (req.user) {
      const isUserAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN;
      const isUserOwner = order.userId === req.user.id;
      
      if (isUserAdmin || isUserOwner) {
        return order;
      }
    }
    
    if (order.guestEmail && email && order.guestEmail.toLowerCase() === email.toLowerCase()) {
      return order;
    }
    
    throw new ForbiddenException('You do not have permission to view this order');
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(@Param('id') id: number, @Body() data: Partial<Order>): Promise<Order> {
    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (data.status && !allowedStatuses.includes(data.status)) {
      throw new BadRequestException(`Invalid status: ${data.status}. Must be one of ${allowedStatuses.join(', ')}`);
    }

    const order = await this.ordersService.update(id, data);
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }
}
