import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { User } from '../auth/user.entity';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Product, Order]),
    AuditLogsModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
