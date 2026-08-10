import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/product.entity';

@Injectable()
export class TikTokService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async generateFeed(): Promise<any> {
    const products = await this.productRepo.find({ where: { stock: undefined }, take: 200, order: { createdAt: 'DESC' } });
    const feed = products.map(p => ({
      id: String(p.id),
      title: p.name,
      description: p.description?.substring(0, 500) || '',
      link: `${process.env.FRONTEND_URL || 'https://beauty-parle.vercel.app'}/en/product/${p.id}`,
      image_link: p.image || '',
      brand: p.brand || 'Beauty Parlé',
      price: `${Number(p.price).toFixed(2)} USD`,
      sale_price: p.mrp ? `${Number(p.price).toFixed(2)} USD` : undefined,
      availability: p.stock > 0 ? 'in_stock' : 'out_of_stock',
      condition: 'new',
      category: p.category || 'Beauty',
      currency: 'USD',
    }));

    return {
      version: '1.0',
      updated_at: new Date().toISOString(),
      total: feed.length,
      products: feed,
    };
  }
}
