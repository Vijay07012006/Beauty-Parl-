import { Controller, Get, Post, Put, Delete, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BeautyBoxesService } from './beauty-boxes.service';

@Controller('beauty-boxes')
export class BeautyBoxesController {
  constructor(
    private readonly boxService: BeautyBoxesService,
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
    return this.boxService.list();
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return this.boxService.get(Number(id));
  }

  @Post()
  async create(@Body() body: any, @Headers('authorization') authHeader?: string) {
    this.checkAdmin(authHeader);
    return this.boxService.create(body);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any, @Headers('authorization') authHeader?: string) {
    this.checkAdmin(authHeader);
    return this.boxService.update(Number(id), body);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Headers('authorization') authHeader?: string) {
    this.checkAdmin(authHeader);
    await this.boxService.delete(Number(id));
    return { success: true };
  }
}
