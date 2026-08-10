import { Controller, Get, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ReferralsService } from './referrals.service';

@Controller('referral')
export class ReferralsController {
  constructor(
    private readonly referralService: ReferralsService,
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

  @Post('generate')
  async generate(@Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);
    return this.referralService.generateCode(userId);
  }

  @Get('stats')
  async stats(@Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);
    return this.referralService.getStats(userId);
  }

  @Post('apply')
  async apply(@Body() body: { code: string; email: string }) {
    await this.referralService.applyReferralCode(body.code, body.email);
    return { success: true };
  }
}
