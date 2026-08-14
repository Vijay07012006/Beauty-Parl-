import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { User } from '../auth/user.entity';
import { Notification } from '../support/notification.entity';
import { SupportModule } from '../support/support.module';
import { EmailModule } from '../email/email.module';
import { InventoryAlertService } from './inventory-alert.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, User, Notification]),
    SupportModule,
    EmailModule,
  ],
  providers: [InventoryAlertService],
  exports: [InventoryAlertService, SupportModule],
})
export class InventoryModule {}
