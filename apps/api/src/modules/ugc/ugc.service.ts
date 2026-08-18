import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UgcPhoto } from './ugc-photo.entity';
import { User } from '../auth/user.entity';

@Injectable()
export class UgcService {
  constructor(
    @InjectRepository(UgcPhoto)
    private readonly ugcRepo: Repository<UgcPhoto>,
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
}
