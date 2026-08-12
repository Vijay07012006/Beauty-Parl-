import { Controller, Get, Post, Delete, Param, Headers, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { RecentlyViewedService } from './recently-viewed.service';
import { OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('recently-viewed')
export class RecentlyViewedController {
  constructor(
    private readonly rvService: RecentlyViewedService,
  ) {}

  private userOrSession(req: Request, sessionHeader?: string) {
    const user = req.user as { id?: number } | undefined;
    return { userId: user?.id, sessionId: sessionHeader };
  }

  @Post(':productId')
  @UseGuards(OptionalJwtAuthGuard)
  async trackView(
    @Param('productId') productId: string,
    @Req() req: Request,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.userOrSession(req, sessionHeader);
    await this.rvService.trackView(Number(productId), userId, sessionId);
    return { success: true };
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getRecent(
    @Req() req: Request,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.userOrSession(req, sessionHeader);
    return this.rvService.getRecent(userId, sessionId);
  }

  @Delete()
  @UseGuards(OptionalJwtAuthGuard)
  async clear(
    @Req() req: Request,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.userOrSession(req, sessionHeader);
    await this.rvService.clear(userId, sessionId);
    return { success: true };
  }
}