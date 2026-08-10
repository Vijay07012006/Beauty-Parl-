import { Controller, Get, Post, Put, Delete, Param, Query, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { BundlesService } from './bundles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('bundles')
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  @Get()
  findAll() {
    return this.bundlesService.findAll();
  }

  @Get('recommended')
  getRecommended(@Query('cart_ids') cartIds: string) {
    const ids = cartIds
      ? cartIds.split(',').map(id => parseInt(id.trim(), 10)).filter(Boolean)
      : [];
    return this.bundlesService.getRecommended(ids);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bundlesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() body: any) {
    return this.bundlesService.create(body);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.bundlesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.bundlesService.delete(id);
  }
}
