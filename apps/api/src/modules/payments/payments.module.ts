import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { RazorpayService } from './razorpay.service';
import { StripeService } from './stripe.service';
import { Order } from '../orders/order.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    EmailModule,
  ],
  controllers: [PaymentsController],
  providers: [RazorpayService, StripeService],
  exports: [RazorpayService, StripeService],
})
export class PaymentsModule {}
