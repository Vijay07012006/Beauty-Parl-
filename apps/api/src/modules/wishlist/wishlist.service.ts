import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from './wishlist.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepo: Repository<Wishlist>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async addToWishlist(userId: number, productId: number) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const existing = await this.wishlistRepo.findOne({
      where: { userId, productId },
    });
    if (existing) throw new BadRequestException('Product already in wishlist');

    const entry = this.wishlistRepo.create({ userId, productId });
    await this.wishlistRepo.save(entry);
    return { success: true, message: 'Added to wishlist' };
  }

  async removeFromWishlist(userId: number, productId: number) {
    const result = await this.wishlistRepo.delete({ userId, productId });
    if (result.affected === 0)
      throw new NotFoundException('Product not in wishlist');
    return { success: true, message: 'Removed from wishlist' };
  }

  async getWishlist(userId: number): Promise<Product[]> {
    const items = await this.wishlistRepo.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
    return items.map((i) => i.product).filter(Boolean);
  }

  async isInWishlist(userId: number, productId: number): Promise<boolean> {
    const count = await this.wishlistRepo.count({
      where: { userId, productId },
    });
    return count > 0;
  }

  async countWishlistItems(userId: number): Promise<number> {
    return this.wishlistRepo.count({ where: { userId } });
  }
}
