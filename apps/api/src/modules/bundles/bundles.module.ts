import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BundlesService } from './bundles.service';
import { BundlesController } from './bundles.controller';
import { Bundle } from './bundle.entity';
import { BundleProduct } from './bundle-product.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Bundle, BundleProduct, Product])],
  controllers: [BundlesController],
  providers: [BundlesService],
  exports: [BundlesService],
})
export class BundlesModule {}
