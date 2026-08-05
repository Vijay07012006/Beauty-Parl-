import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { RazorpayService } from './razorpay.service';
import { Order } from '../orders/order.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    EmailModule,
  ],
  controllers: [PaymentsController],
  providers: [RazorpayService],
  exports: [RazorpayService],
})
export class PaymentsModule {}
