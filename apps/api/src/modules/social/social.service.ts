import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class SocialService {
  private memoryClicks = new Map<string, number>();

  constructor(private readonly redis: RedisService) {}

  async trackClick(platform: string, productId: number): Promise<void> {
    // M-11: only known platforms are stored — arbitrary strings cannot create unbounded keys
    const normPlatform = platform.toLowerCase();
    if (!['instagram', 'facebook', 'whatsapp', 'pinterest', 'twitter'].includes(normPlatform)) {
      return;
    }
    const key = `clicks:${normPlatform}`;
    if (this.redis.isEnabled()) {
      try {
        const current = await this.redis.get(key);
        await this.redis.set(key, String(Number(current || 0) + 1));
      } catch {
        this.memoryClicks.set(normPlatform, (this.memoryClicks.get(normPlatform) || 0) + 1);
      }
    } else {
      this.memoryClicks.set(normPlatform, (this.memoryClicks.get(normPlatform) || 0) + 1);
    }
  }

  async getAnalytics(): Promise<Record<string, number>> {
    const platforms = ['instagram', 'facebook', 'whatsapp', 'pinterest', 'twitter'];
    const result: Record<string, number> = {};

    for (const p of platforms) {
      const key = `clicks:${p}`;
      if (this.redis.isEnabled()) {
        try {
          const val = await this.redis.get(key);
          result[p] = Number(val || 0);
        } catch {
          result[p] = this.memoryClicks.get(p) || 0;
        }
      } else {
        result[p] = this.memoryClicks.get(p) || 0;
      }
    }

    return result;
  }
}
