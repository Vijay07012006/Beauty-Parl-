import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ProductsController } from './products.controller';
import { CategoriesController } from './categories.controller';
import { ReviewsController } from './reviews.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { ProductReview } from './review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductReview]),
    CacheModule.register(),
  ],
  controllers: [ProductsController, CategoriesController, ReviewsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
