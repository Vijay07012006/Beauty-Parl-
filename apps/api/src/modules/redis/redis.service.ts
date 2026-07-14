import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;
  private readonly prefix = 'beauty:'; // 👈 Add this!

  constructor(private config: ConfigService) {
    const url = this.config.get('redis.url');
    this.client = new Redis(url);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    const prefixedKey = `${this.prefix}${key}`; // 👈 Prefix added!
    if (ttl) {
      await this.client.setex(prefixedKey, ttl, value);
    } else {
      await this.client.set(prefixedKey, value);
    }
  }

  async get(key: string): Promise<string | null> {
    const prefixedKey = `${this.prefix}${key}`; // 👈 Prefix added!
    return this.client.get(prefixedKey);
  }

  async del(key: string): Promise<void> {
    const prefixedKey = `${this.prefix}${key}`; // 👈 Prefix added!
    await this.client.del(prefixedKey);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}