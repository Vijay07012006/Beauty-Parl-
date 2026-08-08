import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus, UseInterceptors, UseGuards, Query } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
@UseInterceptors(CacheInterceptor)
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @CacheTTL(60)
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '12',
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minRating') minRating?: string,
    @Query('sort') sort?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await this.productsService.findAllWithFilters({
      skip,
      take: limitNum,
      category: category && category !== 'All' ? category : undefined,
      search,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      sort,
    });

    return {
      products,
      total,
      page: pageNum,
      limit: limitNum,
      hasMore: skip + products.length < total,
    };
  }

  @Get(':id')
  @CacheTTL(60)
  async findOne(@Param('id') id: number): Promise<Product | null> {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() productData: CreateProductDto): Promise<Product> {
    return this.productsService.create(productData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async update(@Param('id') id: number, @Body() productData: CreateProductDto): Promise<Product | null> {
    return this.productsService.update(id, productData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: number): Promise<void> {
    return this.productsService.delete(id);
  }

  // ========== 💬 REVIEWS ENDPOINTS ==========

  @Get(':id/reviews')
  async getReviews(@Param('id') id: number) {
    return this.productsService.findReviews(id);
  }

  @Get(':id/reviews/stats')
  async getReviewStats(@Param('id') id: number) {
    return this.productsService.getRatingStats(id);
  }

  @Post(':id/reviews')
  @HttpCode(HttpStatus.CREATED)
  async postReview(
    @Param('id') id: number,
    @Body() body: { reviewerName: string; rating: number; comment: string }
  ) {
    return this.productsService.createReview(id, body);
  }

  // ========== 🔧 ADMIN REVIEW ENDPOINTS ==========

  @Get('admin/reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAllReviews(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.productsService.getAllReviews(parseInt(page, 10), parseInt(limit, 10));
  }

  @Delete('reviews/:reviewId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteReview(@Param('reviewId') reviewId: number) {
    return this.productsService.deleteReview(reviewId);
  }
}
