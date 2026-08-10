import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LooksService } from './looks.service';
import { LooksController } from './looks.controller';
import { Look } from './look.entity';
import { LookProduct } from './look-product.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Look, LookProduct, Product])],
  controllers: [LooksController],
  providers: [LooksService],
  exports: [LooksService],
})
export class LooksModule {}
