import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { ProductReview } from './review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductReview]),
    CacheModule.register(),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
