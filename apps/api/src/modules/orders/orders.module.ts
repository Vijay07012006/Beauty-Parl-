import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { TrackingService } from './tracking.service';
import { Order } from './order.entity';
import { Product } from '../products/product.entity';
import { Coupon } from '../coupons/coupon.entity';
import { User } from '../auth/user.entity';
import { CartModule } from '../cart/cart.module';
import { LoyaltyModule } from '../loyalty/loyalty.module';
import { GamificationModule } from '../gamification/gamification.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { InventoryModule } from '../inventory/inventory.module';
import { SupportModule } from '../support/support.module';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, Coupon, User]),
    CartModule,
    LoyaltyModule,
    GamificationModule,
    AuditLogsModule,
    InventoryModule,
    SupportModule,
    EmailModule,
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, TrackingService],
  exports: [OrdersService, TrackingService],
})
export class OrdersModule {}
