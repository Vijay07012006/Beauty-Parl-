import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query, BadRequestException, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private supportService: SupportService) {}

  @Post('tickets')
  async createTicket(@Body() body: { subject: string; message: string; orderId?: number }, @Request() req: any) {
    if (!body.subject || !body.message) {
      throw new BadRequestException('Subject and message are required');
    }
    // Extract authenticated user if available
    const user = req.user || null;
    return this.supportService.createTicket(user, body);
  }

  @Get('tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getTickets(@Query('status') status?: string) {
    return this.supportService.getTickets(status);
  }

  @Get('tickets/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getTicketDetails(@Param('id') id: number) {
    return this.supportService.getTicketDetails(Number(id));
  }

  @Post('tickets/:id/reply')
  @UseGuards(JwtAuthGuard)
  async addReply(
    @Param('id') id: number,
    @Body() body: { message: string },
    @Request() req: any,
  ) {
    if (!body.message) {
      throw new BadRequestException('Message content is required');
    }
    const isAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN;
    return this.supportService.addReply(Number(id), req.user, body.message, isAdmin);
  }

  @Put('tickets/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async resolveTicket(@Param('id') id: number, @Request() req: any) {
    return this.supportService.resolveTicket(Number(id), req.user.id);
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getNotifications(@Request() req: any) {
    return this.supportService.getNotifications(req.user.id);
  }

  @Put('notifications/read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markNotificationsRead(@Request() req: any) {
    return this.supportService.markNotificationsRead(req.user.id);
  }
}
