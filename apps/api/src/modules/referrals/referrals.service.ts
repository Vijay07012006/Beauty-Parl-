import { Injectable, forwardRef, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from './referral.entity';
import { ReferralTracking } from './referral-tracking.entity';
import { User } from '../auth/user.entity';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private readonly referralRepo: Repository<Referral>,
    @InjectRepository(ReferralTracking)
    private readonly trackingRepo: Repository<ReferralTracking>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly loyaltyService: LoyaltyService,
    @Inject(forwardRef(() => GamificationService))
    private readonly gameService: GamificationService,
  ) {}

  async generateCode(userId: number): Promise<Referral> {
    const existing = await this.referralRepo.findOne({ where: { referrerId: userId } });
    if (existing) return existing;

    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    const shortName = user.name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `REF-${shortName}-${rand}`;

    const ref = this.referralRepo.create({ referrerId: userId, code });
    return this.referralRepo.save(ref);
  }

  async getStats(userId: number): Promise<any> {
    const ref = await this.referralRepo.findOne({ where: { referrerId: userId } });
    if (!ref) {
      return { code: null, referrals: 0, conversions: 0 };
    }

    const tracking = await this.trackingRepo.find({ where: { referralId: ref.id } });
    const conversions = tracking.filter((t) => t.status === 'completed').length;

    return {
      code: ref.code,
      referrals: tracking.length,
      conversions,
    };
  }

  async applyReferralCode(code: string, referredEmailInput: string): Promise<void> {
    if (typeof code !== 'string' || !code) {
      throw new BadRequestException('Invalid referral code');
    }
    const referredEmail = referredEmailInput?.trim().toLowerCase();
    if (!referredEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(referredEmail)) {
      throw new BadRequestException('A valid email address is required');
    }

    const ref = await this.referralRepo.findOne({
      where: { code: code.trim().toUpperCase() },
      relations: ['referrer'],
    });
    if (!ref) {
      throw new BadRequestException('Invalid referral code');
    }

    // H-2: block self-referral — a user must not earn points by referring their own email
    if (ref.referrer && ref.referrer.email?.toLowerCase() === referredEmail) {
      throw new BadRequestException('You cannot refer yourself');
    }

    // Check if tracking already exists
    const exists = await this.trackingRepo.findOne({ where: { referralId: ref.id, referredEmail } });
    if (exists) return;

    const track = this.trackingRepo.create({
      referralId: ref.id,
      referredEmail,
      status: 'pending',
    });
    await this.trackingRepo.save(track);
  }

  async processReferralJoin(referredEmail: string, newUserId: number): Promise<void> {
    const track = await this.trackingRepo.findOne({
      where: { referredEmail, status: 'pending' },
      relations: ['referral'],
    });

    if (track && track.referral) {
      try {
        const referrerId = track.referral.referrerId;

        // H-2 defense-in-depth: never reward a self-referral (same account)
        if (referrerId === newUserId) {
          track.status = 'completed';
          await this.trackingRepo.save(track);
          return;
        }

        // Reward referrer with 50 points
        await this.loyaltyService.addPoints(referrerId, 50, `Referral Conversion: ${referredEmail} Joined! 🤝`);
        // Reward referred user with 50 points
        await this.loyaltyService.addPoints(newUserId, 50, `Referral Join Bonus! 🤝`);

        // Mark complete
        track.status = 'completed';
        track.rewardClaimed = true;
        await this.trackingRepo.save(track);

        // Trigger Achievement for Referrer
        await this.gameService.triggerAchievement(referrerId, 'referral');
      } catch (err: any) {
        console.error('Failed to process referral conversion:', err.message);
      }
    }
  }
}
