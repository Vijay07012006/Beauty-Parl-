import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UgcPhoto } from './ugc-photo.entity';

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

  async listApproved(productId: number): Promise<UgcPhoto[]> {
    return this.ugcRepo.find({
      where: { productId, isApproved: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async listAllApproved(): Promise<UgcPhoto[]> {
    return this.ugcRepo.find({
      where: { isApproved: true },
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  async listPending(): Promise<UgcPhoto[]> {
    return this.ugcRepo.find({
      where: { isApproved: false },
      relations: ['user', 'product'],
      order: { createdAt: 'ASC' },
    });
  }

  async approve(id: number): Promise<void> {
    await this.ugcRepo.update(id, { isApproved: true });
  }

  async reject(id: number): Promise<void> {
    await this.ugcRepo.delete(id);
  }
}
