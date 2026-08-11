import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemanticSearchController } from './semantic-search.controller';
import { SemanticSearchService } from './semantic-search.service';
import { Product } from '../products/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [SemanticSearchController],
  providers: [SemanticSearchService],
  exports: [SemanticSearchService],
})
export class SemanticSearchModule {}
