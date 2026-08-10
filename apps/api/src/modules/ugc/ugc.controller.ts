import { Controller, Get, Post, Put, Delete, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UgcService } from './ugc.service';

@Controller('ugc')
export class UgcController {
  constructor(
    private readonly ugcService: UgcService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(authHeader?: string): number {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token missing or invalid');
    }
    try {
      const token = authHeader.split(' ')[1];
      const payload = this.jwtService.verify(token);
      if (payload?.sub) return Number(payload.sub);
    } catch {}
    throw new UnauthorizedException('Authentication token signature verification failed');
  }

  @Post()
  async upload(
    @Body() body: { productId: number; imageUrl: string; caption?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.ugcService.uploadPhoto(body.productId, body.imageUrl, body.caption, userId);
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
  async listPending(@Headers('authorization') authHeader?: string) {
    this.extractUserId(authHeader);
    return this.ugcService.listPending();
  }

  @Put('admin/approve/:id')
  async approve(@Param('id') id: string, @Headers('authorization') authHeader?: string) {
    this.extractUserId(authHeader);
    await this.ugcService.approve(Number(id));
    return { success: true };
  }

  @Delete('admin/reject/:id')
  async reject(@Param('id') id: string, @Headers('authorization') authHeader?: string) {
    this.extractUserId(authHeader);
    await this.ugcService.reject(Number(id));
    return { success: true };
  }
}
