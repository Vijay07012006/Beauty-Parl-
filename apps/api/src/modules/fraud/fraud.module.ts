import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FraudAlert } from './fraud-alert.entity';
import { Order } from '../orders/order.entity';
import { UserSession } from '../auth/user-session.entity';
import { User } from '../auth/user.entity';
import { FraudDetectionService } from './fraud-detection.service';
import { FraudController } from './fraud.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FraudAlert, Order, UserSession, User]),
  ],
  providers: [FraudDetectionService],
  controllers: [FraudController],
  exports: [FraudDetectionService],
})
export class FraudModule {}
