import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveEvent } from './live-event.entity';

@Injectable()
export class LiveShoppingService {
  constructor(
    @InjectRepository(LiveEvent)
    private readonly eventRepo: Repository<LiveEvent>,
  ) {
    this.seedDefaultEvents();
  }

  private async seedDefaultEvents() {
    try {
      const count = await this.eventRepo.count();
      if (count === 0) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const defaults = [
          {
            title: 'Flawless Summer Glow Masterclass 🌸',
            description:
              'Join our makeup directors live to learn blending techniques, contour guidelines, and matte hacks using our new catalog primers.',
            streamUrl:
              'https://assets.mixkit.co/videos/preview/mixkit-beautiful-woman-applying-makeup-40671-large.mp4', // beautiful high quality video placeholder
            isLive: true,
          },
          {
            title: 'Clinical Hydration Routine Setup 💄',
            description:
              'Interactive routine builder walkthrough. How to diagnose dry spots and configure auto-replenishment subscriptions.',
            streamUrl:
              'https://assets.mixkit.co/videos/preview/mixkit-woman-cleansing-her-face-with-water-44671-large.mp4',
            isLive: false,
            scheduledAt: tomorrow,
          },
        ];
        await this.eventRepo.save(this.eventRepo.create(defaults));
        console.log('🌱 Seeded default Live Shopping events');
      }
    } catch (err: any) {
      console.error('Failed to seed live shopping events:', err.message);
    }
  }

  async list(): Promise<LiveEvent[]> {
    return this.eventRepo.find({
      order: { scheduledAt: 'ASC', createdAt: 'DESC' },
    });
  }

  async get(id: number): Promise<LiveEvent> {
    return this.eventRepo.findOneOrFail({
      where: { id },
      relations: ['featuredProduct'],
    });
  }

  async create(payload: Partial<LiveEvent>): Promise<LiveEvent> {
    const event = this.eventRepo.create(payload);
    return this.eventRepo.save(event);
  }

  async update(id: number, payload: Partial<LiveEvent>): Promise<LiveEvent> {
    await this.eventRepo.update(id, payload);
    return this.get(id);
  }
}
