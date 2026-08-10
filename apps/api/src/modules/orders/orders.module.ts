import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './order.entity';
import { CartModule } from '../cart/cart.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { GamificationModule } from '../gamification/gamification.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    CartModule,
    LoyaltyModule,
    GamificationModule,
    AuditLogsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
