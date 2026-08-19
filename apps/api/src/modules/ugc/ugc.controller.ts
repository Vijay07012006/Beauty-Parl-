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
import { UgcService } from './ugc.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ugc')
export class UgcController {
  constructor(private readonly ugcService: UgcService) {}

  private requireAdmin(req: Request): void {
    const user = req.user as any;
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      throw new UnauthorizedException(
        'Access denied. Administrator privileges required.',
      );
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async upload(
    @Body() body: { productId: number; imageUrl: string; caption?: string },
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.ugcService.uploadPhoto(
      body.productId,
      body.imageUrl,
      body.caption,
      userId,
    );
  }

  @Get('product/:productId')
  async listProduct(@Param('productId') productId: string) {
    return this.ugcService.listApproved(Number(productId));
  }

  @Get('gallery')
  async listAll() {
    return this.ugcService.listAllApproved();
  }

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard)
  async listPending(@Req() req: Request) {
    this.requireAdmin(req);
    return this.ugcService.listPending();
  }

  @Put('admin/approve/:id')
  @UseGuards(JwtAuthGuard)
  async approve(@Param('id') id: string, @Req() req: Request) {
    this.requireAdmin(req);
    await this.ugcService.approve(Number(id));
    return { success: true };
  }

  @Delete('admin/reject/:id')
  @UseGuards(JwtAuthGuard)
  async reject(@Param('id') id: string, @Req() req: Request) {
    this.requireAdmin(req);
    await this.ugcService.reject(Number(id));
    return { success: true };
  }
}
