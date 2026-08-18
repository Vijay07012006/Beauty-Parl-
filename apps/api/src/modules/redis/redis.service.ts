import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;
  private readonly prefix = 'beauty:';

  constructor(private config: ConfigService) {
    const url = this.config.get<string>('redis.url');
    const isRedisDisabled =
      process.env.REDIS_DISABLED === 'true' || !process.env.REDIS_URL;

    if (isRedisDisabled) {
      console.warn(
        '⚠️ [Redis] Redis is disabled. Falling back to in-memory store.',
      );
      this.client = null;
    } else {
      try {
        this.client = new Redis(url!, {
          connectTimeout: 5000,
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          lazyConnect: true,
        });
        this.client.connect().catch(() => {});
        this.client.on('error', (err) => {
          console.warn('⚠️ [Redis] Client error:', err.message);
        });
      } catch (err: any) {
        console.error(
          '⚠️ [Redis] Failed to initialize Redis client:',
          err.message,
        );
        this.client = null;
      }
    }
  }

  isEnabled(): boolean {
    return this.client !== null;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.client) return;
    const prefixedKey = `${this.prefix}${key}`;
    try {
      if (ttl) {
        await this.client.setex(prefixedKey, ttl, value);
      } else {
        await this.client.set(prefixedKey, value);
      }
    } catch (err: any) {
      console.warn('⚠️ [Redis] set operation failed:', err.message);
      throw err;
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.client) return null;
    const prefixedKey = `${this.prefix}${key}`;
    try {
      return await this.client.get(prefixedKey);
    } catch (err: any) {
      console.warn('⚠️ [Redis] get operation failed:', err.message);
      throw err;
    }
  }

  async del(key: string): Promise<void> {
    if (!this.client) return;
    const prefixedKey = `${this.prefix}${key}`;
    try {
      await this.client.del(prefixedKey);
    } catch (err: any) {
      console.warn('⚠️ [Redis] del operation failed:', err.message);
      throw err;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {}
    }
  }
}
