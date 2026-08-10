import { Controller, Get, Post, Delete, Param, Headers } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RecentlyViewedService } from './recently-viewed.service';

@Controller('recently-viewed')
export class RecentlyViewedController {
  constructor(
    private readonly rvService: RecentlyViewedService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserOrSession(authHeader?: string, sessionHeader?: string) {
    let userId: number | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token);
        if (payload?.sub) userId = Number(payload.sub);
      } catch {}
    }
    return { userId, sessionId: sessionHeader };
  }

  @Post(':productId')
  async trackView(
    @Param('productId') productId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.extractUserOrSession(authHeader, sessionHeader);
    await this.rvService.trackView(Number(productId), userId, sessionId);
    return { success: true };
  }

  @Get()
  async getRecent(
    @Headers('authorization') authHeader?: string,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.extractUserOrSession(authHeader, sessionHeader);
    return this.rvService.getRecent(userId, sessionId);
  }

  @Delete()
  async clear(
    @Headers('authorization') authHeader?: string,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.extractUserOrSession(authHeader, sessionHeader);
    await this.rvService.clear(userId, sessionId);
    return { success: true };
  }
}
