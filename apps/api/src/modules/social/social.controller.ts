import { Controller, Get, Post, Body } from '@nestjs/common';
import { SocialService } from './social.service';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('track-click')
  async trackClick(@Body() body: { platform: string; productId: number }) {
    await this.socialService.trackClick(body.platform, body.productId);
    return { success: true };
  }

  @Get('analytics')
  async getAnalytics() {
    return this.socialService.getAnalytics();
  }
}
