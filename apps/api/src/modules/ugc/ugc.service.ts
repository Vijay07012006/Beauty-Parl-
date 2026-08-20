import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UgcPhoto } from './ugc-photo.entity';
import { User } from '../auth/user.entity';
import { CreatorLook } from './creator-look.entity';
import { CommissionEarning } from './commission-earning.entity';
import { CreatorLookClick } from './creator-look-click.entity';

@Injectable()
export class UgcService {
  constructor(
    @InjectRepository(UgcPhoto)
    private readonly ugcRepo: Repository<UgcPhoto>,
    @InjectRepository(CreatorLook)
    private readonly lookRepo: Repository<CreatorLook>,
    @InjectRepository(CommissionEarning)
    private readonly earningRepo: Repository<CommissionEarning>,
    @InjectRepository(CreatorLookClick)
    private readonly clickRepo: Repository<CreatorLookClick>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async uploadPhoto(
    productId: number,
    imageUrl: string,
    caption: string | undefined,
    userId: number,
  ): Promise<UgcPhoto> {
    const photo = this.ugcRepo.create({
      productId,
      imageUrl,
      caption,
      userId,
      isApproved: false, // requires admin moderation approval
    });
    return this.ugcRepo.save(photo);
  }

  // CRITICAL (C-1): the full User relation is NEVER returned to clients — only
  // safe, public fields (id, name, avatar). Loading the raw relation would expose
  // bcrypt hashes, reset tokens and 2FA secrets on public endpoints.
  private async findWithUser(
    where: Partial<UgcPhoto>,
    relations: string[],
  ): Promise<UgcPhoto[]> {
    const photos = await this.ugcRepo.find({
      where,
      relations,
      order: { createdAt: 'DESC' },
    });
    return photos.map((photo) => {
      const user = photo.user;
      if (user) {
        (photo as any).user = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        };
      }
      return photo;
    });
  }

  async listApproved(productId: number): Promise<UgcPhoto[]> {
    return this.findWithUser({ productId, isApproved: true }, ['user']);
  }

  async listAllApproved(): Promise<UgcPhoto[]> {
    const photos = await this.ugcRepo.find({
      where: { isApproved: true },
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
    });
    return photos.map((photo) => {
      const user = photo.user;
      if (user) {
        (photo as any).user = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        };
      }
      return photo;
    });
  }

  async listPending(): Promise<UgcPhoto[]> {
    const photos = await this.ugcRepo.find({
      where: { isApproved: false },
      relations: ['user', 'product'],
      order: { createdAt: 'ASC' },
    });
    return photos.map((photo) => {
      const user = photo.user;
      if (user) {
        (photo as any).user = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        };
      }
      return photo;
    });
  }

  async approve(id: number): Promise<void> {
    await this.ugcRepo.update(id, { isApproved: true });
  }

  async reject(id: number): Promise<void> {
    await this.ugcRepo.delete(id);
  }

  // Extension for Creator UGC & Commissions
  async createLook(
    userId: number,
    title: string,
    imageUrl: string,
    taggedProductIds: number[],
  ): Promise<CreatorLook> {
    const look = this.lookRepo.create({
      userId,
      title,
      imageUrl,
      taggedProductIds,
      status: 'pending',
    });
    return this.lookRepo.save(look);
  }

  async listApprovedLooks(): Promise<CreatorLook[]> {
    const looks = await this.lookRepo.find({
      where: { status: 'approved' },
      order: { createdAt: 'DESC' },
    });
    for (const look of looks) {
      const user = await this.userRepo.findOne({ where: { id: look.userId } });
      if (user) {
        (look as any).user = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        };
      }
    }
    return looks;
  }

  async listPendingLooks(): Promise<CreatorLook[]> {
    const looks = await this.lookRepo.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
    });
    for (const look of looks) {
      const user = await this.userRepo.findOne({ where: { id: look.userId } });
      if (user) {
        (look as any).user = {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
        };
      }
    }
    return looks;
  }

  async approveLook(id: number): Promise<void> {
    await this.lookRepo.update(id, { status: 'approved' });
  }

  async rejectLook(id: number): Promise<void> {
    await this.lookRepo.update(id, { status: 'rejected' });
  }

  async recordClick(
    lookId: number,
    productId: number,
    visitorId: string,
    userId?: number,
  ): Promise<void> {
    const click = this.clickRepo.create({
      lookId,
      productId,
      visitorId,
      userId,
    });
    await this.clickRepo.save(click);
    await this.lookRepo.increment({ id: lookId }, 'clicksCount', 1);
  }

  async getCreatorDashboard(userId: number) {
    const looksCount = await this.lookRepo.count({ where: { userId } });
    
    const looks = await this.lookRepo.find({ where: { userId } });
    const totalClicks = looks.reduce((acc, look) => acc + (look.clicksCount || 0), 0);

    const earnings = await this.earningRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    const totalEarnings = earnings.reduce((acc, earn) => acc + Number(earn.amount), 0);

    return {
      stats: {
        looksCount,
        totalClicks,
        totalEarnings: Number(totalEarnings.toFixed(2)),
      },
      earnings,
      looks,
    };
  }
}
