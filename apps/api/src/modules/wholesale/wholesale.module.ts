import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WholesaleOrder } from './entities/wholesale.entity';
import { Product } from '../products/product.entity';
import { WholesaleService } from './wholesale.service';
import { WholesaleController } from './wholesale.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([WholesaleOrder, Product]),
  ],
  controllers: [WholesaleController],
  providers: [WholesaleService],
  exports: [WholesaleService],
})
export class WholesaleModule {}
