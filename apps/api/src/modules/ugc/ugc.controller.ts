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
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';

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

  // Extensions for UGC Creator Looks

  @Get('looks')
  async listLooks() {
    return this.ugcService.listApprovedLooks();
  }

  @Post('looks')
  @UseGuards(JwtAuthGuard)
  async uploadLook(
    @Req() req: Request,
    @Body() body: { title: string; imageUrl: string; taggedProductIds: number[] },
  ) {
    const userId = (req.user as any).id;
    return this.ugcService.createLook(
      userId,
      body.title,
      body.imageUrl,
      body.taggedProductIds,
    );
  }

  @Post('looks/:id/click')
  @UseGuards(OptionalJwtAuthGuard)
  async recordLookClick(
    @Param('id') id: string,
    @Req() req: Request,
    @Body() body: { productId: number; visitorId: string },
  ) {
    const userId = (req.user as any)?.id ? Number((req.user as any).id) : undefined;
    await this.ugcService.recordClick(
      Number(id),
      body.productId,
      body.visitorId,
      userId,
    );
    return { success: true };
  }

  @Get('creator/dashboard')
  @UseGuards(JwtAuthGuard)
  async getCreatorDashboard(@Req() req: Request) {
    const userId = (req.user as any).id;
    return this.ugcService.getCreatorDashboard(userId);
  }

  @Get('admin/looks/pending')
  @UseGuards(JwtAuthGuard)
  async listPendingLooks(@Req() req: Request) {
    this.requireAdmin(req);
    return this.ugcService.listPendingLooks();
  }

  @Put('admin/looks/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveLook(@Param('id') id: string, @Req() req: Request) {
    this.requireAdmin(req);
    await this.ugcService.approveLook(Number(id));
    return { success: true };
  }

  @Put('admin/looks/:id/reject')
  @UseGuards(JwtAuthGuard)
  async rejectLook(@Param('id') id: string, @Req() req: Request) {
    this.requireAdmin(req);
    await this.ugcService.rejectLook(Number(id));
    return { success: true };
  }
}
