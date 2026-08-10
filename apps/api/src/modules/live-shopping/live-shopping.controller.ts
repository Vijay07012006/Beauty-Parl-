import { Controller, Get, Post, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LiveShoppingService } from './live-shopping.service';

@Controller('live-shopping')
export class LiveShoppingController {
  constructor(
    private readonly liveService: LiveShoppingService,
    private readonly jwtService: JwtService,
  ) {}

  private checkAdmin(authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token missing or invalid');
    }
    try {
      const token = authHeader.split(' ')[1];
      const payload = this.jwtService.verify(token);
      if (payload?.role === 'admin') return;
    } catch {}
    throw new UnauthorizedException('Admin privileges required');
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
  async create(@Body() body: any, @Headers('authorization') authHeader?: string) {
    this.checkAdmin(authHeader);
    return this.liveService.create(body);
  }
}
