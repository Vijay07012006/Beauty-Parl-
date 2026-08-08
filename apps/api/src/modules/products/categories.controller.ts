import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ProductsService } from './products.service';

@Controller('categories')
@UseInterceptors(CacheInterceptor)
export class CategoriesController {
  constructor(private productsService: ProductsService) {}

  @Get()
  @CacheTTL(60)
  async findAll() {
    return this.productsService.findCategories();
  }
}
