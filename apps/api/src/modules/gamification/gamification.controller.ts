import { Controller, Get, Post, Param, UseGuards, Req, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GamificationService } from './gamification.service';
import { Order } from '../orders/order.entity';
import { Referral } from '../referrals/referral.entity';
import { ReferralTracking } from '../referrals/referral-tracking.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly gameService: GamificationService,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Referral) private readonly referralRepo: Repository<Referral>,
    @InjectRepository(ReferralTracking) private readonly trackingRepo: Repository<ReferralTracking>,
  ) {}

  @Get('achievements')
  @UseGuards(JwtAuthGuard)
  async getAchievements(@Req() req: Request) {
    const userId = (req.user as { id: number }).id;
    return this.gameService.getAchievements(userId);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.gameService.getLeaderboard();
  }

  @Post('trigger/:type')
  @UseGuards(JwtAuthGuard)
  async trigger(
    @Param('type') type: any,
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: number }).id;

    // Server-side proof: only grant achievements that are backed by real user activity.
    let proven = false;
    switch (type) {
      case 'purchase': {
        const orders = await this.orderRepo.count({ where: { userId } });
        proven = orders > 0;
        break;
      }
      case 'referral': {
        const refs = await this.referralRepo.find({ where: { referrerId: userId } });
        const refIds = refs.map((r) => r.id);
        const completed = refIds.length
          ? await this.trackingRepo.count({ where: { referralId: In(refIds), status: 'completed' } })
          : 0;
        proven = completed > 0;
        break;
      }
      default:
        throw new BadRequestException('Unknown or unsupported achievement trigger type');
    }

    if (!proven) {
      throw new ForbiddenException('Achievement cannot be unlocked without the corresponding activity');
    }

    const unlocked = await this.gameService.triggerAchievement(userId, type);
    return { success: true, unlocked };
  }
}
