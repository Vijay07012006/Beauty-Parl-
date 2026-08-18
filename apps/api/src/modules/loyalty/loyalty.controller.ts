import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('points')
  @UseGuards(JwtAuthGuard)
  async getPoints(@Req() req: Request) {
    const userId = (req.user as { id: number }).id;
    return this.loyaltyService.getPointsAndTier(userId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactions(@Req() req: Request) {
    const userId = (req.user as { id: number }).id;
    return this.loyaltyService.getTransactions(userId);
  }

  @Get('rewards')
  async getRewards() {
    return this.loyaltyService.getRewards();
  }

  @Post('redeem/:rewardId')
  @UseGuards(JwtAuthGuard)
  async redeem(@Param('rewardId') rewardId: string, @Req() req: Request) {
    const userId = (req.user as { id: number }).id;
    return this.loyaltyService.redeemReward(Number(rewardId), userId);
  }
}
