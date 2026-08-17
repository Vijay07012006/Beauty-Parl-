import { Controller, Post, Body, Get, Param, Put, NotFoundException, UseGuards, Request, ForbiddenException, BadRequestException, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { TrackingService } from './tracking.service';
import { Order } from './order.entity';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('orders')
export class OrdersController {
  constructor(
    private ordersService: OrdersService,
    private trackingService: TrackingService,
  ) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  async create(@Request() req: any, @Body() orderData: any): Promise<Order> {
    // userId is derived from the verified JWT — never from the request body (O1)
    const userId = req.user?.id ? Number(req.user.id) : undefined;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
    const userAgent = req.headers['user-agent'];
    return this.ordersService.create(orderData, userId, { ipAddress, userAgent });
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

  @Put(':id/tracking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateTracking(
    @Param('id') id: string,
    @Body() body: { latitude: number; longitude: number; status?: string },
  ) {
    return this.trackingService.updateTracking(Number(id), body.latitude, body.longitude, body.status);
  }

  @Get(':id/tracking')
  async getTracking(@Param('id') id: string) {
    return this.trackingService.getTracking(Number(id));
  }
}
