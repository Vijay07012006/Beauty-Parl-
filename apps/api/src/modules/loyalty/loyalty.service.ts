import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { User } from '../auth/user.entity';
import { LoyaltyTransaction } from './loyalty-transaction.entity';
import { LoyaltyReward } from './loyalty-reward.entity';

@Injectable()
export class LoyaltyService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(LoyaltyTransaction)
    private readonly transactionRepo: Repository<LoyaltyTransaction>,
    @InjectRepository(LoyaltyReward)
    private readonly rewardRepo: Repository<LoyaltyReward>,
  ) {
    this.seedDefaultRewards();
  }

  private async seedDefaultRewards() {
    try {
      const count = await this.rewardRepo.count();
      if (count === 0) {
        const defaults = [
          { name: 'Rs. 100 Discount Coupon', description: 'Redeem 100 points to get Rs. 100 discount off your next purchase.', pointsRequired: 100, discountAmount: 100 },
          { name: 'Free Shipping Voucher', description: 'Redeem 50 points to unlock free shipping on your next order.', pointsRequired: 50, freeShipping: true },
          { name: 'Rs. 500 Premium Voucher', description: 'Redeem 400 points to get Rs. 500 voucher discount.', pointsRequired: 400, discountAmount: 500 },
        ];
        await this.rewardRepo.save(this.rewardRepo.create(defaults));
        console.log('🌱 Seeded default Loyalty Rewards catalog');
      }
    } catch (err: any) {
      console.error('Failed to seed loyalty rewards:', err.message);
    }
  }

  async getPointsAndTier(userId: number): Promise<any> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    return {
      points: user.loyaltyPoints,
      tier: user.loyaltyTier,
      totalSpent: Number(user.totalSpent),
    };
  }

  async getTransactions(userId: number): Promise<LoyaltyTransaction[]> {
    return this.transactionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getRewards(): Promise<LoyaltyReward[]> {
    return this.rewardRepo.find({ where: { isActive: true } });
  }

  async addPoints(userId: number, points: number, reason: string): Promise<void> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    user.loyaltyPoints += points;
    
    // Evaluate Tiers
    if (user.loyaltyPoints >= 500) {
      user.loyaltyTier = 'platinum';
    } else if (user.loyaltyPoints >= 100) {
      user.loyaltyTier = 'gold';
    } else {
      user.loyaltyTier = 'silver';
    }

    await this.userRepo.save(user);

    const tx = this.transactionRepo.create({ userId, points, reason });
    await this.transactionRepo.save(tx);
  }

  async recordPurchase(userId: number, total: number): Promise<void> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    user.totalSpent = Number(user.totalSpent) + Number(total);
    
    const points = Math.round(Number(total) * 0.1);
    user.loyaltyPoints += points;

    if (user.loyaltyPoints >= 500) {
      user.loyaltyTier = 'platinum';
    } else if (user.loyaltyPoints >= 100) {
      user.loyaltyTier = 'gold';
    } else {
      user.loyaltyTier = 'silver';
    }

    await this.userRepo.save(user);

    const tx = this.transactionRepo.create({
      userId,
      points,
      reason: `Order Purchase Reward Points! 🛍️`,
    });
    await this.transactionRepo.save(tx);
  }

  async redeemReward(rewardId: number, userId: number): Promise<any> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    const reward = await this.rewardRepo.findOneOrFail({ where: { id: rewardId, isActive: true } });

    if (user.loyaltyPoints < reward.pointsRequired) {
      throw new Error('Insufficient points balance');
    }

    user.loyaltyPoints -= reward.pointsRequired;
    
    // Update tier status after deduction
    if (user.loyaltyPoints >= 500) {
      user.loyaltyTier = 'platinum';
    } else if (user.loyaltyPoints >= 100) {
      user.loyaltyTier = 'gold';
    } else {
      user.loyaltyTier = 'silver';
    }

    await this.userRepo.save(user);

    const tx = this.transactionRepo.create({
      userId,
      points: -reward.pointsRequired,
      reason: `Redeemed Reward: ${reward.name}`,
    });
    await this.transactionRepo.save(tx);

    return {
      success: true,
      rewardCode: 'LOYAL_' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      reward,
    };
  }

  @Cron('0 8 * * *')
  async checkBirthdays() {
    console.log('⏰ Running Birthday Rewards cron checks...');
    const today = new Date();
    const todayStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const users = await this.userRepo.find();
    for (const u of users) {
      if (u.birthday) {
        const bdate = new Date(u.birthday);
        const bStr = `${String(bdate.getMonth() + 1).padStart(2, '0')}-${String(bdate.getDate()).padStart(2, '0')}`;
        
        if (todayStr === bStr) {
          try {
            // Award 50 points on birthday
            await this.addPoints(u.id, 50, 'Happy Birthday Reward Points! 🎂');
            console.log(`🎂 Birthday reward credited to user #${u.id} (${u.email})`);
          } catch (err: any) {
            console.error(`Failed to credit birthday reward for user #${u.id}:`, err.message);
          }
        }
      }
    }
  }
}
