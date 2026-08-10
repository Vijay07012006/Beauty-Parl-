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

  async findAllWithFilters(options: {
    skip: number;
    take: number;
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    sort?: string;
    tags?: string;
  }) {
    const { skip, take, category, search, minPrice, maxPrice, minRating, sort, tags } = options;

    const queryBuilder = this.productRepository.createQueryBuilder('product');

    if (category && category.toLowerCase() !== 'all') {
      // Allow case insensitive category match or slug mapping
      if (category.toLowerCase() === 'tools') {
        queryBuilder.andWhere('product.category IN (:...cats)', { cats: ['Tools & Brushes', 'Tools'] });
      } else if (category.toLowerCase() === 'luxury') {
        queryBuilder.andWhere('product.category IN (:...cats)', { cats: ['Luxury Collection', 'Luxury'] });
      } else {
        queryBuilder.andWhere('LOWER(product.category) = :category', { category: category.toLowerCase() });
      }
    }

    if (search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.brand ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    if (minPrice !== undefined && !isNaN(minPrice)) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (minRating !== undefined && !isNaN(minRating)) {
      queryBuilder.andWhere('product.rating >= :minRating', { minRating });
    }

    if (tags) {
      const tagList = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
      if (tagList.length > 0) {
        const subQuery = queryBuilder.subQuery()
          .select('ptm.productId')
          .from('product_tag_mapping', 'ptm')
          .innerJoin('product_tags', 'pt', 'pt.id = ptm.tagId')
          .where('LOWER(pt.name) IN (:...tagList)', { tagList })
          .groupBy('ptm.productId')
          .having('COUNT(ptm.tagId) >= :tagCount', { tagCount: tagList.length })
          .getQuery();
        queryBuilder.andWhere(`product.id IN ${subQuery}`);
      }
    }

    // Sorting
    switch (sort) {
      case 'price-asc':
        queryBuilder.orderBy('product.price', 'ASC');
        break;
      case 'price-desc':
        queryBuilder.orderBy('product.price', 'DESC');
        break;
      case 'rating-desc':
        queryBuilder.orderBy('product.rating', 'DESC');
        break;
      case 'newest':
        queryBuilder.orderBy('product.createdAt', 'DESC');
        break;
      default:
        queryBuilder.orderBy('product.id', 'ASC');
    }

    const [products, total] = await queryBuilder
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return [products, total] as [Product[], number];
  }

  async findCategories() {
    const query = `
      SELECT c.id, c.name, c.slug, c.description, c.image, 
             COALESCE(p.count, 0) as count
      FROM categories c
      LEFT JOIN (
        SELECT category, COUNT(*) as count 
        FROM products 
        GROUP BY category
      ) p ON (
        LOWER(p.category) = LOWER(c.slug) OR
        (c.slug = 'tools' AND p.category = 'Tools & Brushes') OR
        (c.slug = 'luxury' AND p.category = 'Luxury Collection') OR
        (c.slug = 'mens-grooming' AND p.category = 'Men''s Grooming') OR
        (c.slug = 'natural-organic' AND p.category = 'Natural & Organic') OR
        (c.slug = 'bath-body' AND p.category = 'Bath & Body')
      )
      ORDER BY c.id ASC
    `;
    const results = await this.productRepository.manager.query(query);
    return results.map((r: any) => ({
      ...r,
      count: parseInt(r.count, 10)
    }));
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

  async findApprovedReviews(productId: number): Promise<ProductReview[]> {
    return this.reviewRepository.find({
      where: { productId, isApproved: true },
      order: { createdAt: 'DESC' }
    });
  }

  async approveReview(reviewId: number): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) {
      throw new NotFoundException(`Review with ID ${reviewId} not found`);
    }
    await this.reviewRepository.update(reviewId, { isApproved: true });
    await this.recalculateRating(review.productId);
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
    await this.recalculateRating(productId);

    return review;
  }

  async getRatingStats(productId: number): Promise<{ average: number; count: number }> {
    const reviews = await this.reviewRepository.find({ where: { productId } });
    const count = reviews.length;
    if (count === 0) return { average: 0, count: 0 };
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return { average: parseFloat((total / count).toFixed(1)), count };
  }

  private async recalculateRating(productId: number): Promise<void> {
    const reviews = await this.reviewRepository.find({ where: { productId } });
    const ratingCount = reviews.length;
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(2)) : 4.50;
    await this.productRepository.update(productId, { rating: avgRating, ratingCount });
  }

  // ========== 🔧 ADMIN REVIEW METHODS ==========

  async getAllReviews(page: number = 1, limit: number = 20): Promise<{ reviews: ProductReview[]; total: number }> {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { reviews, total };
  }

  async deleteReview(reviewId: number): Promise<{ success: boolean }> {
    const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    const { productId } = review;
    await this.reviewRepository.delete(reviewId);
    await this.recalculateRating(productId);
    return { success: true };
  }
}

