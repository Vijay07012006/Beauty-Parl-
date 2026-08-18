import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  /**
   * Customers also bought:
   * Finds orders containing target productId, aggregates other productIds in those orders,
   * and returns the most frequent ones.
   */
  async getAlsoBought(productId: number, limit = 4): Promise<Product[]> {
    // 1. Find orders containing this product using JSONB containment — avoids loading the whole table
    const orders = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.items', 'items')
      .where(`o.items @> :filter`, { filter: JSON.stringify([{ productId }]) })
      .orderBy('o.createdAt', 'DESC')
      .take(1000)
      .getRawMany();

    const relatedProductCounts: { [id: number]: number } = {};

    // 2. Loop through matching orders and count co-occurrences
    for (const row of orders) {
      const items = Array.isArray(row?.items) ? row.items : [];
      for (const item of items) {
        const id = Number(item?.productId);
        if (id && id !== productId) {
          relatedProductCounts[id] = (relatedProductCounts[id] || 0) + 1;
        }
      }
    }

    // 3. Sort by occurrences
    const sortedIds = Object.keys(relatedProductCounts)
      .map(Number)
      .sort((a, b) => relatedProductCounts[b] - relatedProductCounts[a])
      .slice(0, limit);

    if (sortedIds.length === 0) {
      // Fallback: return similar products in same category
      return this.getSimilar(productId, limit);
    }

    // 4. Fetch full product details
    return this.productRepo.find({
      where: { id: In(sortedIds) },
    });
  }

  /**
   * You may also like:
   * Finds products sharing the same category (or brand), excluding the target product.
   */
  async getSimilar(productId: number, limit = 4): Promise<Product[]> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) {
      return this.getPopular(limit);
    }

    // Find products in same category
    let similar = await this.productRepo.find({
      where: {
        category: product.category,
        id: Not(productId),
      },
      take: limit,
      order: { rating: 'DESC' },
    });

    if (similar.length < limit) {
      // Fill remaining slots with popular items
      const popular = await this.getPopular(limit);
      const existingIds = similar.map((p) => p.id);
      const remaining = popular.filter(
        (p) => p.id !== productId && !existingIds.includes(p.id),
      );
      similar = [...similar, ...remaining].slice(0, limit);
    }

    return similar;
  }

  /**
   * Recommended for you:
   * Personalized recommendations based on past purchase history category match, or fallback to popular.
   */
  async getPersonalized(userId: number | null, limit = 4): Promise<Product[]> {
    if (!userId) {
      return this.getPopular(limit);
    }

    // 1. Fetch user's recent orders (capped to bound memory/CPU)
    const orders = await this.orderRepo.find({
      where: { userId },
      select: ['items'],
      order: { createdAt: 'DESC' },
      take: 100,
    });

    if (orders.length === 0) {
      return this.getPopular(limit);
    }

    // 2. Count categories purchased
    const categoryCounts: { [category: string]: number } = {};
    const purchasedProductIds: number[] = [];

    for (const order of orders) {
      for (const item of order.items) {
        const prodId = Number(item.productId);
        if (prodId) purchasedProductIds.push(prodId);
      }
    }

    // Fetch purchased products categories
    if (purchasedProductIds.length > 0) {
      const products = await this.productRepo.find({
        where: { id: In(purchasedProductIds) },
        select: ['category'],
      });

      for (const prod of products) {
        if (prod.category) {
          categoryCounts[prod.category] =
            (categoryCounts[prod.category] || 0) + 1;
        }
      }
    }

    // 3. Get user's top categories
    const topCategories = Object.keys(categoryCounts).sort(
      (a, b) => categoryCounts[b] - categoryCounts[a],
    );

    if (topCategories.length === 0) {
      return this.getPopular(limit);
    }

    // 4. Query products in top categories, excluding already purchased ones
    const recommendations = await this.productRepo.find({
      where: {
        category: In(topCategories),
        id:
          purchasedProductIds.length > 0
            ? Not(In(purchasedProductIds))
            : undefined,
      },
      take: limit,
      order: { rating: 'DESC' },
    });

    if (recommendations.length < limit) {
      // Fill remaining with popular
      const popular = await this.getPopular(limit);
      const recIds = recommendations.map((p) => p.id);
      const remaining = popular.filter((p) => !recIds.includes(p.id));
      return [...recommendations, ...remaining].slice(0, limit);
    }

    return recommendations;
  }

  /**
   * Popular products: fallback option
   */
  async getPopular(limit = 4): Promise<Product[]> {
    return this.productRepo.find({
      order: { rating: 'DESC', ratingCount: 'DESC' },
      take: limit,
    });
  }
}
