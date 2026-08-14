import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/user.entity';
import { CheckoutController } from './checkout.controller';
import { OneClickCheckoutService } from './one-click-checkout.service';
import { OrdersModule } from '../orders/orders.module';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    OrdersModule,
    CartModule,
  ],
  controllers: [CheckoutController],
  providers: [OneClickCheckoutService],
  exports: [OneClickCheckoutService],
})
export class CheckoutModule {}
