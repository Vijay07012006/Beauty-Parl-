import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisualSearchController } from './visual-search.controller';
import { VisualSearchService } from './visual-search.service';
import { ProductEmbedding } from './product-embedding.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEmbedding, Product])],
  controllers: [VisualSearchController],
  providers: [VisualSearchService],
  exports: [VisualSearchService],
})
export class VisualSearchModule {}
