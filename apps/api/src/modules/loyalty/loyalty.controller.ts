import { Controller, Get, Post, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoyaltyService } from './loyalty.service';

@Controller('loyalty')
export class LoyaltyController {
  constructor(
    private readonly loyaltyService: LoyaltyService,
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

  @Get('points')
  async getPoints(@Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);
    return this.loyaltyService.getPointsAndTier(userId);
  }

  @Get('transactions')
  async getTransactions(@Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);
    return this.loyaltyService.getTransactions(userId);
  }

  @Get('rewards')
  async getRewards() {
    return this.loyaltyService.getRewards();
  }

  @Post('redeem/:rewardId')
  async redeem(@Param('rewardId') rewardId: string, @Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);
    return this.loyaltyService.redeemReward(Number(rewardId), userId);
  }
}
