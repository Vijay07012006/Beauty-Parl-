import { Controller, Get, Post, Param, Headers, UnauthorizedException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GamificationService } from './gamification.service';
import { Order } from '../orders/order.entity';
import { Referral } from '../referrals/referral.entity';
import { ReferralTracking } from '../referrals/referral-tracking.entity';

@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly gameService: GamificationService,
    private readonly jwtService: JwtService,
    @InjectRepository(Order) private readonly orderRepo: Repository<Order>,
    @InjectRepository(Referral) private readonly referralRepo: Repository<Referral>,
    @InjectRepository(ReferralTracking) private readonly trackingRepo: Repository<ReferralTracking>,
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

  @Get('achievements')
  async getAchievements(@Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);
    return this.gameService.getAchievements(userId);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.gameService.getLeaderboard();
  }

  @Post('trigger/:type')
  async trigger(
    @Param('type') type: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = this.extractUserId(authHeader);

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
