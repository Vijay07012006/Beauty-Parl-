import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('referral')
export class ReferralsController {
  constructor(private readonly referralService: ReferralsService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generate(@Req() req: Request) {
    const userId = (req.user as { id: number }).id;
    return this.referralService.generateCode(userId);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async stats(@Req() req: Request) {
    const userId = (req.user as { id: number }).id;
    return this.referralService.getStats(userId);
  }

  @Post('apply')
  async apply(@Body() body: { code: string; email: string }) {
    await this.referralService.applyReferralCode(body.code, body.email);
    return { success: true };
  }
}
