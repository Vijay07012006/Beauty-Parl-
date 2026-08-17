import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashSale } from './flash-sale.entity';
import { FlashSalesService } from './flash-sales.service';
import { FlashSalesController } from './flash-sales.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FlashSale])],
  providers: [FlashSalesService],
  controllers: [FlashSalesController],
  exports: [FlashSalesService],
})
export class FlashSalesModule {}
