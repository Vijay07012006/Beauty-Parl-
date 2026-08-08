import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private addressesService: AddressesService) {}

  @Get()
  async getAddresses(@Request() req: any) {
    return this.addressesService.getAddresses(req.user.id);
  }

  @Get('default')
  async getDefaultAddress(@Request() req: any) {
    return this.addressesService.getDefaultAddress(req.user.id);
  }

  @Get(':id')
  async getAddress(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addressesService.getAddress(req.user.id, id);
  }

  @Post()
  async createAddress(@Request() req: any, @Body() data: any) {
    return this.addressesService.createAddress(req.user.id, data);
  }

  @Put(':id')
  async updateAddress(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.addressesService.updateAddress(req.user.id, id, data);
  }

  @Put(':id/default')
  async setDefaultAddress(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addressesService.setDefaultAddress(req.user.id, id);
  }

  @Delete(':id')
  async deleteAddress(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.addressesService.deleteAddress(req.user.id, id);
  }
}
