import { Controller, Post, Get, Param, UseGuards, Request } from '@nestjs/common';
import { CoShoppingService } from './co-shopping.service';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';
import { CoShoppingGateway } from './co-shopping.gateway';

@Controller('co-shopping')
export class CoShoppingController {
  constructor(
    private readonly coShoppingService: CoShoppingService,
    private readonly coShoppingGateway: CoShoppingGateway,
  ) {}

  @Post('room')
  @UseGuards(JwtAuthGuard)
  async createRoom(@Request() req: any) {
    const userId = Number(req.user.id);
    return this.coShoppingService.createRoom(userId);
  }

  @Get('room/:id')
  @UseGuards(OptionalJwtAuthGuard)
  async getRoom(@Param('id') id: string) {
    return this.coShoppingService.getRoom(id);
  }

  @Post('room/:id/checkout')
  @UseGuards(OptionalJwtAuthGuard)
  async checkoutRoom(@Param('id') id: string) {
    const room = await this.coShoppingService.checkoutRoom(id);
    this.coShoppingGateway.server.to(id).emit('room:checkout', { roomId: id });
    return { success: true, room };
  }
}
