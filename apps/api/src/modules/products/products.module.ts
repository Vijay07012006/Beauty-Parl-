import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ProductsController } from './products.controller';
import { CategoriesController } from './categories.controller';
import { ReviewsController } from './reviews.controller';
import { ProductsService } from './products.service';
import { BulkImportService } from './bulk-import.service';
import { BulkExportService } from './bulk-export.service';
import { Product } from './product.entity';
import { ProductReview } from './review.entity';
import { Order } from '../orders/order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductReview, Order]),
    CacheModule.register(),
  ],
  controllers: [ProductsController, CategoriesController, ReviewsController],
  providers: [ProductsService, BulkImportService, BulkExportService],
  exports: [ProductsService, BulkImportService, BulkExportService],
})
export class ProductsModule {}
