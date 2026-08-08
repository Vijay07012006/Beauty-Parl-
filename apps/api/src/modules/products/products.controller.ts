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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('category') category?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('rating') rating?: string,
    @Query('brand') brand?: string,
    @Query('search') search?: string,
  ) {
    if (page || limit || category || minPrice || maxPrice || rating || brand || search) {
      const pageNum = parseInt(page || '1', 10) || 1;
      const limitNum = parseInt(limit || '12', 10) || 12;
      
      const filters = {
        category,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        rating: rating ? parseFloat(rating) : undefined,
        brand,
        search,
      };

      return this.productsService.findPaginated(pageNum, limitNum, filters);
    }
    return this.productsService.findAll();
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

  @Post(':id/reviews')
  @HttpCode(HttpStatus.CREATED)
  async postReview(
    @Param('id') id: number,
    @Body() body: { reviewerName: string; rating: number; comment: string }
  ) {
    return this.productsService.createReview(id, body);
  }
}
