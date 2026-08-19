import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { BeautyBoxesService } from './beauty-boxes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('beauty-boxes')
export class BeautyBoxesController {
  constructor(private readonly boxService: BeautyBoxesService) {}

  private requireAdmin(req: Request): void {
    const user = req.user as any;
    // M-7: super_admin must be able to manage beauty boxes too
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      throw new UnauthorizedException('Admin privileges required');
    }
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
  @UseGuards(JwtAuthGuard)
  async create(@Body() body: any, @Req() req: Request) {
    this.requireAdmin(req);
    return this.boxService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @Req() req: Request,
  ) {
    this.requireAdmin(req);
    return this.boxService.update(Number(id), body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@Param('id') id: string, @Req() req: Request) {
    this.requireAdmin(req);
    await this.boxService.delete(Number(id));
    return { success: true };
  }
}
