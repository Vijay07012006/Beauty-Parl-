import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('returns')
@UseGuards(JwtAuthGuard)
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post()
  async requestReturn(
    @Request() req: any,
    @Body() body: { orderId: number; reason: string },
  ) {
    const userId = Number(req.user.id);
    if (!body.orderId || !body.reason) {
      throw new BadRequestException('orderId and reason are required');
    }
    return this.returnsService.requestReturn(userId, body.orderId, body.reason);
  }

  @Get()
  async getReturns(@Request() req: any) {
    const userId = Number(req.user.id);
    const role = req.user.role;
    const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
    return this.returnsService.getReturns(userId, isAdmin);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateReturnStatus(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected' | 'completed' },
  ) {
    if (!['approved', 'rejected', 'completed'].includes(body.status)) {
      throw new BadRequestException('Invalid status. Must be one of approved, rejected, or completed');
    }
    return this.returnsService.updateReturnStatus(Number(id), body.status);
  }
}
