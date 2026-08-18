import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as crypto from 'crypto';
import { RecentlyViewed } from './recently-viewed.entity';
import { Product } from '../products/product.entity';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RecentlyViewedService {
  private memoryStore = new Map<string, string>();
  // Random per-boot fallback key — anonymous users WITHOUT a session id never share each other's data
  private readonly anonFallbackKey = `anon-${crypto.randomBytes(16).toString('hex')}`;

  constructor(
    @InjectRepository(RecentlyViewed)
    private readonly rvRepo: Repository<RecentlyViewed>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly redis: RedisService,
  ) {}

  private getCacheKey(userId?: number, sessionId?: string): string {
    if (userId) return `user:${userId}`;
    return `session:${sessionId || this.anonFallbackKey}`;
  }

  async trackView(
    productId: number,
    userId?: number,
    sessionId?: string,
  ): Promise<void> {
    const key = this.getCacheKey(userId, sessionId);

    // 1. Sync to Cache
    const current = await this.getCachedIds(key);
    const updated = [
      productId,
      ...current.filter((id) => id !== productId),
    ].slice(0, 10);
    await this.setCachedIds(key, updated);

    // 2. Sync to Database if logged in
    if (userId) {
      try {
        let rv = await this.rvRepo.findOne({ where: { userId, productId } });
        if (rv) {
          rv.viewedAt = new Date();
          await this.rvRepo.save(rv);
        } else {
          rv = this.rvRepo.create({ userId, productId });
          await this.rvRepo.save(rv);
        }

        const allRv = await this.rvRepo.find({
          where: { userId },
          order: { viewedAt: 'DESC' },
        });

        if (allRv.length > 10) {
          const toDelete = allRv.slice(10).map((r) => r.id);
          await this.rvRepo.delete(toDelete);
        }
      } catch (err) {
        console.error('Failed to save recently viewed to database:', err);
      }
    }
  }

  async getRecent(userId?: number, sessionId?: string): Promise<Product[]> {
    const key = this.getCacheKey(userId, sessionId);
    let ids = await this.getCachedIds(key);

    if (ids.length === 0 && userId) {
      const dbRv = await this.rvRepo.find({
        where: { userId },
        order: { viewedAt: 'DESC' },
        take: 10,
      });
      ids = dbRv.map((r) => r.productId);
      if (ids.length > 0) {
        await this.setCachedIds(key, ids);
      }
    }

    if (ids.length === 0) return [];

    const products = await this.productRepo.find({
      where: { id: In(ids) },
    });

    // Retain exact chronological order of view ids
    return ids
      .map((id) => products.find((p) => p.id === id))
      .filter(Boolean) as Product[];
  }

  async clear(userId?: number, sessionId?: string): Promise<void> {
    const key = this.getCacheKey(userId, sessionId);
    await this.setCachedIds(key, []);

    if (userId) {
      await this.rvRepo.delete({ userId });
    }
  }

  private async getCachedIds(key: string): Promise<number[]> {
    let data: string | null = null;
    if (this.redis.isEnabled()) {
      try {
        data = await this.redis.get(`rv:${key}`);
      } catch {
        data = this.memoryStore.get(key) || null;
      }
    } else {
      data = this.memoryStore.get(key) || null;
    }
    return data ? JSON.parse(data) : [];
  }

  private async setCachedIds(key: string, ids: number[]): Promise<void> {
    const value = JSON.stringify(ids);
    if (this.redis.isEnabled()) {
      try {
        await this.redis.set(`rv:${key}`, value, 86400 * 7); // 7 days expiration
      } catch {
        this.memoryStore.set(key, value);
      }
    } else {
      this.memoryStore.set(key, value);
    }
  }
}
