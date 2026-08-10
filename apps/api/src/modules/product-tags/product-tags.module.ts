import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductTagsService } from './product-tags.service';
import { ProductTagsController } from './product-tags.controller';
import { ProductTag } from './product-tag.entity';
import { ProductTagMapping } from './product-tag-mapping.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ProductTag, ProductTagMapping, Product])],
  controllers: [ProductTagsController],
  providers: [ProductTagsService],
  exports: [ProductTagsService],
})
export class ProductTagsModule {}
