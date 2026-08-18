import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from './achievement.entity';
import { UserAchievement } from './user-achievement.entity';
import { User } from '../auth/user.entity';
import { LoyaltyService } from '../loyalty/loyalty.service';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private readonly uaRepo: Repository<UserAchievement>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly loyaltyService: LoyaltyService,
  ) {
    this.seedDefaultAchievements();
  }

  private async seedDefaultAchievements() {
    try {
      const count = await this.achievementRepo.count();
      if (count === 0) {
        const defaults: Array<Partial<Achievement>> = [
          {
            name: 'Routine Enthusiast',
            description:
              'Run a neural face scan or custom routine quiz diagnostic.',
            icon: '🧪',
            pointsReward: 20,
            triggerType: 'daily_visit',
          },
          {
            name: 'Beauty Critic',
            description:
              'Write an honest product look review or upload lookbook photo.',
            icon: '✍️',
            pointsReward: 30,
            triggerType: 'review',
          },
          {
            name: 'Social Advocate',
            description: 'Share a cosmetic link to Facebook, X, or WhatsApp.',
            icon: '📢',
            pointsReward: 15,
            triggerType: 'social_share',
          },
          {
            name: 'Brand Influencer',
            description: 'Generate a referral code and invite a friend.',
            icon: '🤝',
            pointsReward: 50,
            triggerType: 'referral',
          },
          {
            name: 'Regimen Invested',
            description: 'Complete your first cosmetic product checkout.',
            icon: '🛍️',
            pointsReward: 40,
            triggerType: 'purchase',
          },
        ];
        await this.achievementRepo.save(this.achievementRepo.create(defaults));
        console.log('🌱 Seeded default Gamification Achievements catalog');
      }
    } catch (err: any) {
      console.error('Failed to seed achievements:', err.message);
    }
  }

  async getAchievements(userId: number): Promise<any[]> {
    const achievements = await this.achievementRepo.find();
    const unlocked = await this.uaRepo.find({ where: { userId } });
    const unlockedIds = unlocked.map((u) => u.achievementId);

    return achievements.map((ach) => ({
      ...ach,
      unlocked: unlockedIds.includes(ach.id),
    }));
  }

  async triggerAchievement(
    userId: number,
    triggerType:
      | 'review'
      | 'social_share'
      | 'profile_complete'
      | 'daily_visit'
      | 'purchase'
      | 'referral',
  ): Promise<Achievement | null> {
    const ach = await this.achievementRepo.findOne({ where: { triggerType } });
    if (!ach) return null;

    // Check if already unlocked
    const exists = await this.uaRepo.findOne({
      where: { userId, achievementId: ach.id },
    });
    if (exists) return null;

    // Unlock
    const ua = this.uaRepo.create({ userId, achievementId: ach.id });
    await this.uaRepo.save(ua);

    // Reward points
    await this.loyaltyService.addPoints(
      userId,
      ach.pointsReward,
      `Unlocked Achievement: ${ach.name} 🏆`,
    );

    return ach;
  }

  async getLeaderboard(): Promise<any[]> {
    return this.userRepo.find({
      select: ['id', 'name', 'loyaltyPoints', 'loyaltyTier'],
      order: { loyaltyPoints: 'DESC' },
      take: 5,
    });
  }
}
