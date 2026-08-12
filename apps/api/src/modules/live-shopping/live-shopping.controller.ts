import { Controller, Get, Post, Body, Param, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { LiveShoppingService } from './live-shopping.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('live-shopping')
export class LiveShoppingController {
  constructor(
    private readonly liveService: LiveShoppingService,
  ) {}

  private requireAdmin(req: Request): void {
    const user = req.user as { role?: string } | undefined;
    // LS-4: super_admin was missing — both admin roles may manage live events
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      throw new UnauthorizedException('Admin privileges required');
    }
  }

  @Get()
  async list() {
    return this.liveService.list();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.liveService.get(Number(id));
  }

  @Post('create')
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any, @Req() req: Request) {
    this.requireAdmin(req);
    return this.liveService.create(body);
  }
}
