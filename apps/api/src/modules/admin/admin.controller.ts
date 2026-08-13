import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Request, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { User, UserRole, sanitizeUser } from '../auth/user.entity';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { AuditLog } from '../audit-logs/audit-log.entity';
import { ActiveSession } from '../audit-logs/active-session.entity';
import { OrdersService } from '../orders/orders.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { EmailService } from '../email/email.service';

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
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    @InjectRepository(ActiveSession)
    private activeSessionRepo: Repository<ActiveSession>,
    private ordersService: OrdersService,
    private auditLogsService: AuditLogsService,
    private emailService: EmailService,
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
  async getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = Math.max(1, parseInt(page || '', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '', 10) || 10));
    const [users, total] = await this.userRepo.findAndCount({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      order: { createdAt: 'DESC' },
    });
    return { users: users.map((u) => sanitizeUser(u)), total, page: pageNum, limit: limitNum };
  }

  @Put('users/:id/role')
  async updateUserRole(@Param('id') id: number, @Body() body: { role: UserRole }, @Request() req: any) {
    // Validate role is a real enum value (prevents arbitrary string injection)
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(body?.role)) {
      throw new BadRequestException('Invalid role');
    }

    const targetId = Number(id);
    if (!Number.isInteger(targetId)) {
      throw new BadRequestException('Invalid user id');
    }

    // No one may change their own role — blocks self-promotion to super_admin (C2)
    if (req.user && req.user.id === targetId) {
      throw new BadRequestException('You cannot change your own role.');
    }

    const actorRole: UserRole = req.user?.role;

    // Only SUPER_ADMIN may grant ADMIN or SUPER_ADMIN
    if ((body.role === UserRole.ADMIN || body.role === UserRole.SUPER_ADMIN) && actorRole !== UserRole.SUPER_ADMIN) {
      throw new BadRequestException('Only super admins can grant admin roles');
    }

    // ADMIN cannot demote another admin/super admin; SUPER_ADMIN can manage anyone
    const target = await this.userRepo.findOne({ where: { id: targetId } });
    if (target && actorRole === UserRole.ADMIN && (target.role === UserRole.ADMIN || target.role === UserRole.SUPER_ADMIN)) {
      throw new BadRequestException('Admins cannot modify other admin accounts');
    }

    const beforeValue = target ? { role: target.role } : null;
    await this.userRepo.update(targetId, { role: body.role });
    const afterValue = { role: body.role };

    await this.auditLogsService.log({
      action: 'ADMIN_UPDATE_USER_ROLE',
      userEmail: req.user?.email,
      userId: req.user?.id,
      entityType: 'User',
      entityId: targetId,
      beforeValue,
      afterValue,
    });
    return { success: true };
  }

  @Put('users/:id/status')
  async updateUserStatus(@Param('id') id: number, @Body() body: { isActive: boolean }, @Request() req: any) {
    const targetId = Number(id);
    if (!Number.isInteger(targetId)) {
      throw new BadRequestException('Invalid user id');
    }
    if (req.user && req.user.id === targetId) {
      throw new BadRequestException('You cannot change your own account status.');
    }
    const target = await this.userRepo.findOne({ where: { id: targetId } });
    if (req.user?.role === UserRole.ADMIN && target && (target.role === UserRole.ADMIN || target.role === UserRole.SUPER_ADMIN)) {
      throw new BadRequestException('Admins cannot modify other admin accounts');
    }

    const beforeValue = target ? { isActive: target.isActive } : null;
    await this.userRepo.update(targetId, { isActive: !!body.isActive });
    const afterValue = { isActive: !!body.isActive };

    await this.auditLogsService.log({
      action: 'ADMIN_UPDATE_USER_STATUS',
      userEmail: req.user?.email,
      userId: req.user?.id,
      entityType: 'User',
      entityId: targetId,
      beforeValue,
      afterValue,
    });
    return { success: true };
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: number, @Request() req: any) {
    const targetId = Number(id);
    if (!Number.isInteger(targetId)) {
      throw new BadRequestException('Invalid user id');
    }
    if (req.user && req.user.id === targetId) {
      throw new BadRequestException('You cannot delete your own account.');
    }
    const target = await this.userRepo.findOne({ where: { id: targetId } });
    if (req.user?.role === UserRole.ADMIN && target && (target.role === UserRole.ADMIN || target.role === UserRole.SUPER_ADMIN)) {
      throw new BadRequestException('Admins cannot delete other admin accounts');
    }
    await this.userRepo.delete(targetId);
    await this.auditLogsService.log('ADMIN_DELETE_USER', req.user?.email, req.user?.id, { targetUserId: id });
    return { success: true };
  }

  // Products Management (Admin override)
  @Post('products')
  async createProduct(@Body() data: Partial<Product>, @Request() req: any) {
    const product = this.productRepo.create(data);
    const saved = await this.productRepo.save(product);
    await this.auditLogsService.log('ADMIN_CREATE_PRODUCT', req.user?.email, req.user?.id, { productId: saved.id, name: saved.name });
    return saved;
  }

  @Put('products/:id')
  async updateProduct(@Param('id') id: number, @Body() data: Partial<Product>, @Request() req: any) {
    const beforeProduct = await this.productRepo.findOne({ where: { id } });
    await this.productRepo.update(id, data);
    const afterProduct = await this.productRepo.findOne({ where: { id } });

    await this.auditLogsService.log({
      action: 'ADMIN_UPDATE_PRODUCT',
      userEmail: req.user?.email,
      userId: req.user?.id,
      entityType: 'Product',
      entityId: id,
      beforeValue: beforeProduct,
      afterValue: afterProduct,
    });
    return afterProduct;
  }

  @Delete('products/:id')
  async deleteProduct(@Param('id') id: number, @Request() req: any) {
    await this.productRepo.delete(id);
    await this.auditLogsService.log('ADMIN_DELETE_PRODUCT', req.user?.email, req.user?.id, { productId: id });
    return { success: true };
  }

  // Orders Management
  @Get('orders')
  async getOrders(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = Math.max(1, parseInt(page || '', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '', 10) || 10));
    const [orders, total] = await this.orderRepo.findAndCount({
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      order: { createdAt: 'DESC' },
    });
    return { orders, total, page: pageNum, limit: limitNum };
  }

  @Put('orders/:id/status')
  async updateOrderStatus(@Param('id') id: number, @Body() body: { status: any }, @Request() req: any) {
    const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(body?.status)) {
      throw new BadRequestException(`Invalid status: ${body?.status}`);
    }
    const beforeOrder = await this.orderRepo.findOne({ where: { id } });
    const order = await this.ordersService.update(id, { status: body.status });
    if (!order) {
      throw new BadRequestException('Order not found');
    }
    const afterOrder = await this.orderRepo.findOne({ where: { id } });

    await this.auditLogsService.log({
      action: 'ADMIN_UPDATE_ORDER_STATUS',
      userEmail: req.user?.email,
      userId: req.user?.id,
      entityType: 'Order',
      entityId: id,
      beforeValue: beforeOrder ? { status: beforeOrder.status } : null,
      afterValue: { status: body.status },
    });
    return { success: true };
  }

  @Get('orders/:id')
  async getOrderDetail(@Param('id') id: number) {
    return this.orderRepo.findOne({ where: { id } });
  }

  @Delete('users/:id/permanent')
  @Roles(UserRole.SUPER_ADMIN)
  async permanentDeleteUser(@Param('id') id: number, @Request() req: any) {
    const targetId = Number(id);
    if (!Number.isInteger(targetId)) {
      throw new BadRequestException('Invalid user id');
    }
    if (req.user && req.user.id === targetId) {
      throw new BadRequestException('You cannot permanently delete your own account.');
    }
    await this.userRepo.delete(targetId);
    await this.auditLogsService.log('SUPERADMIN_PERMANENT_DELETE_USER', req.user?.email, req.user?.id, { targetUserId: id });
    return { success: true };
  }

  @Put('users/:id/suspend')
  @Roles(UserRole.SUPER_ADMIN)
  async suspendUser(
    @Param('id') id: number,
    @Body() body: { reason: string; duration: '1d' | '7d' | '30d' | 'permanent' },
    @Request() req: any
  ) {
    const targetId = Number(id);
    if (!Number.isInteger(targetId)) {
      throw new BadRequestException('Invalid user id');
    }
    if (req.user && req.user.id === targetId) {
      throw new BadRequestException('You cannot suspend your own account.');
    }

    const target = await this.userRepo.findOne({ where: { id: targetId } });
    if (!target) {
      throw new BadRequestException('User not found');
    }

    let suspendedUntil: Date | null = null;
    const now = new Date();
    if (body.duration === '1d') {
      suspendedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (body.duration === '7d') {
      suspendedUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (body.duration === '30d') {
      suspendedUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      // Permanent suspension: set to far future date
      suspendedUntil = new Date(now.getTime() + 100 * 365 * 24 * 60 * 60 * 1000);
    }

    await this.userRepo.update(targetId, {
      isActive: false,
      suspendedUntil,
      suspensionReason: body.reason,
    });

    try {
      await this.emailService.sendSuspensionEmail(target.email, body.reason, body.duration);
    } catch (err) {
      console.error('Failed to send suspension email:', err);
    }

    await this.auditLogsService.log('SUPERADMIN_SUSPEND_USER', req.user?.email, req.user?.id, {
      targetUserId: id,
      reason: body.reason,
      duration: body.duration,
    });

    return { success: true };
  }

  @Put('users/:id/reactivate')
  @Roles(UserRole.SUPER_ADMIN)
  async reactivateUser(@Param('id') id: number, @Request() req: any) {
    const targetId = Number(id);
    if (!Number.isInteger(targetId)) {
      throw new BadRequestException('Invalid user id');
    }
    await this.userRepo.update(targetId, {
      isActive: true,
      suspendedUntil: undefined,
      suspensionReason: undefined,
    });
    await this.auditLogsService.log('SUPERADMIN_REACTIVATE_USER', req.user?.email, req.user?.id, { targetUserId: id });
    return { success: true };
  }

  @Get('audit-logs')
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '', 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit || '', 10) || 20));
    const qb = this.auditLogRepo.createQueryBuilder('log').orderBy('log.createdAt', 'DESC');
    if (action) {
      qb.where('log.action ILIKE :action', { action: `%${action}%` });
    }
    const [logs, total] = await qb.skip((pageNum - 1) * limitNum).take(limitNum).getManyAndCount();
    return { logs, total, page: pageNum, limit: limitNum };
  }

  @Get('users/:id/details')
  async getUserDetails(@Param('id') id: number) {
    const user = await this.userRepo.findOne({ where: { id: Number(id) } });
    if (!user) throw new BadRequestException('User not found');
    const orders = await this.orderRepo.find({
      where: { userId: Number(id) },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    return { user: sanitizeUser(user), orders, totalSpent };
  }

  @Get('active-sessions')
  async getActiveSessions() {
    const sessions = await this.activeSessionRepo.find({
      where: { isActive: true },
      order: { lastActivity: 'DESC' },
    });

    // Match with user profiles to show name and email
    const enriched = await Promise.all(
      sessions.map(async (sess) => {
        const u = await this.userRepo.findOne({
          where: { id: sess.userId },
          select: ['id', 'name', 'email', 'role'],
        });
        return {
          ...sess,
          user: u || { name: 'Unknown', email: 'Unknown', role: 'user' },
        };
      })
    );

    return enriched;
  }

  @Delete('active-sessions/:sessionId')
  async terminateSession(@Param('sessionId') sessionId: string) {
    await this.activeSessionRepo.update({ sessionId }, { isActive: false });
    return { success: true };
  }

  @Get('audit-logs/stats')
  async getAuditStats() {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentCount = await this.auditLogRepo.count({
      where: {
        createdAt: Between(twentyFourHoursAgo, now) as any,
      },
    });

    // Top active users
    const topActors = await this.auditLogRepo
      .createQueryBuilder('log')
      .select('log.userEmail', 'email')
      .addSelect('COUNT(*)', 'count')
      .where('log.userEmail IS NOT NULL')
      .groupBy('log.userEmail')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    // Most modified entities
    const topEntities = await this.auditLogRepo
      .createQueryBuilder('log')
      .select('log.entityType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('log.entityType IS NOT NULL')
      .groupBy('log.entityType')
      .orderBy('count', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      recentCount,
      topActors,
      topEntities,
    };
  }
}
