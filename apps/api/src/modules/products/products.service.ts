import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { ProductReview } from './review.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductReview)
    private reviewRepository: Repository<ProductReview>,
  ) {}

  async findAll(category?: string): Promise<Product[]> {
    if (category && category.toLowerCase() !== 'all') {
      return this.productRepository.find({
        where: { category }
      });
    }
    return this.productRepository.find();
  }

  async findOne(id: number): Promise<Product | null> {
    return this.productRepository.findOne({ where: { id } });
  }

  async findPaginated(
    page: number,
    limit: number,
    filters?: {
      category?: string;
      minPrice?: number;
      maxPrice?: number;
      rating?: number;
      brand?: string;
      search?: string;
    }
  ): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const query = this.productRepository.createQueryBuilder('product');

    if (filters) {
      if (filters.category && filters.category.toLowerCase() !== 'all') {
        query.andWhere('LOWER(product.category) = :category', { category: filters.category.toLowerCase() });
      }
      if (filters.minPrice !== undefined && !isNaN(filters.minPrice)) {
        query.andWhere('product.price >= :minPrice', { minPrice: filters.minPrice });
      }
      if (filters.maxPrice !== undefined && !isNaN(filters.maxPrice)) {
        query.andWhere('product.price <= :maxPrice', { maxPrice: filters.maxPrice });
      }
      if (filters.rating !== undefined && !isNaN(filters.rating)) {
        query.andWhere('product.rating >= :rating', { rating: filters.rating });
      }
      if (filters.brand) {
        query.andWhere('LOWER(product.brand) = :brand', { brand: filters.brand.toLowerCase() });
      }
      if (filters.search) {
        query.andWhere(
          '(LOWER(product.name) LIKE :search OR LOWER(product.description) LIKE :search OR LOWER(product.brand) LIKE :search)',
          { search: `%${filters.search.toLowerCase()}%` }
        );
      }
    }

    query.orderBy('product.id', 'ASC')
         .skip((page - 1) * limit)
         .take(limit);

    const [data, total] = await query.getManyAndCount();
    return { data, total, page, limit };
  }

  async create(productData: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(productData);
    return this.productRepository.save(product);
  }

  async update(id: number, productData: Partial<Product>): Promise<Product | null> {
    await this.productRepository.update(id, productData);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.productRepository.delete(id);
  }

  // ========== 💬 REVIEWS SYSTEM METHODS ==========

  async findReviews(productId: number): Promise<ProductReview[]> {
    return this.reviewRepository.find({
      where: { productId },
      order: { createdAt: 'DESC' }
    });
  }

  async createReview(
    productId: number,
    reviewData: { reviewerName: string; rating: number; comment: string }
  ): Promise<ProductReview> {
    const product = await this.findOne(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    const review = this.reviewRepository.create({
      productId,
      reviewerName: reviewData.reviewerName,
      rating: reviewData.rating,
      comment: reviewData.comment
    });
    await this.reviewRepository.save(review);

    // Recalculate average rating & ratingCount for the product
    const reviews = await this.reviewRepository.find({ where: { productId } });
    const ratingCount = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(2)) : 4.50;

    await this.productRepository.update(productId, {
      rating: avgRating,
      ratingCount
    });

    return review;
  }
}
