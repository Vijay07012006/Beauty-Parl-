import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as crypto from 'crypto';
import { Product } from '../products/product.entity';

@Injectable()
export class ComparisonService {
  private memoryStore = new Map<string, string>();
  // Random per-boot fallback key — anonymous users WITHOUT a session id never share each other's data
  private readonly anonFallbackKey = `anon-${crypto.randomBytes(16).toString('hex')}`;

  constructor(
    private readonly redis: RedisService,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  private getStoreKey(userId?: number, sessionId?: string): string {
    if (userId) return `user:${userId}`;
    return `session:${sessionId || this.anonFallbackKey}`;
  }

  async add(
    productId: number,
    userId?: number,
    sessionId?: string,
  ): Promise<number[]> {
    const key = this.getStoreKey(userId, sessionId);
    const current = await this.getIds(key);
    if (!current.includes(productId)) {
      current.push(productId);
      if (current.length > 4) {
        current.shift(); // Limit to comparing 4 products at a time
      }
      await this.setIds(key, current);
    }
    return current;
  }

  async remove(
    productId: number,
    userId?: number,
    sessionId?: string,
  ): Promise<number[]> {
    const key = this.getStoreKey(userId, sessionId);
    const current = await this.getIds(key);
    const updated = current.filter((id) => id !== productId);
    await this.setIds(key, updated);
    return updated;
  }

  async getComparisonList(
    userId?: number,
    sessionId?: string,
  ): Promise<number[]> {
    const key = this.getStoreKey(userId, sessionId);
    return this.getIds(key);
  }

  async getCompareData(userId?: number, sessionId?: string): Promise<any> {
    const key = this.getStoreKey(userId, sessionId);
    const ids = await this.getIds(key);
    if (ids.length === 0) return { products: [], differences: {} };

    const products = await this.productRepo.find({
      where: { id: In(ids) },
    });

    const brands = new Set(products.map((p) => p.brand).filter(Boolean));
    const categories = new Set(products.map((p) => p.category).filter(Boolean));
    const prices = new Set(products.map((p) => Number(p.price)));
    const ratings = new Set(products.map((p) => Number(p.rating)));

    return {
      products,
      differences: {
        brand: brands.size > 1,
        category: categories.size > 1,
        price: prices.size > 1,
        rating: ratings.size > 1,
      },
    };
  }

  async clear(userId?: number, sessionId?: string): Promise<void> {
    const key = this.getStoreKey(userId, sessionId);
    await this.setIds(key, []);
  }

  private async getIds(key: string): Promise<number[]> {
    let data: string | null = null;
    if (this.redis.isEnabled()) {
      try {
        data = await this.redis.get(`compare:${key}`);
      } catch {
        data = this.memoryStore.get(key) || null;
      }
    } else {
      data = this.memoryStore.get(key) || null;
    }
    return data ? JSON.parse(data) : [];
  }

  private async setIds(key: string, ids: number[]): Promise<void> {
    const value = JSON.stringify(ids);
    if (this.redis.isEnabled()) {
      try {
        await this.redis.set(`compare:${key}`, value, 3600); // 1 hr TTL
      } catch {
        this.memoryStore.set(key, value);
      }
    } else {
      this.memoryStore.set(key, value);
    }
  }
}
