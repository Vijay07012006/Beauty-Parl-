import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../auth/user.entity';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { AuditLog } from '../audit-logs/audit-log.entity';
import { ActiveSession } from '../audit-logs/active-session.entity';
import { OrdersModule } from '../orders/orders.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { ProductsModule } from '../products/products.module';
import { InventoryModule } from '../inventory/inventory.module';
import { BulkUserActionsService } from './bulk-user-actions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product, Order, AuditLog, ActiveSession]),
    OrdersModule,
    AuditLogsModule,
    ProductsModule,
    InventoryModule,
  ],
  controllers: [AdminController],
  providers: [BulkUserActionsService],
})
export class AdminModule {}
