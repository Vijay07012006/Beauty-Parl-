import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/user.entity';
import { OrdersService } from '../orders/orders.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OneClickCheckoutService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly ordersService: OrdersService,
    private readonly cartService: CartService,
  ) {}

  async savePaymentMethod(
    userId: number,
    method: { cardId: string; last4: string; brand: string; expiry: string },
  ): Promise<any> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const saved = user.savedPaymentMethods || [];
    // Ensure we don't save duplicate cards
    const exists = saved.some((m: any) => m.cardId === method.cardId);
    if (!exists) {
      saved.push({
        id: 'pm_' + Math.random().toString(36).substr(2, 9),
        ...method,
        createdAt: new Date().toISOString(),
      });
      user.savedPaymentMethods = saved;
      await this.userRepo.save(user);
    }
    return user.savedPaymentMethods;
  }

  async getSavedPaymentMethods(userId: number): Promise<any[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user.savedPaymentMethods || [];
  }

  async oneClickCheckout(
    userId: number,
    data: {
      savedMethodId: string;
      items: any[];
      shippingAddress: any;
      couponCode?: string;
      discount?: number;
      pointsRedeemed?: number;
    },
  ): Promise<any> {
    const savedMethods = await this.getSavedPaymentMethods(userId);
    const method = savedMethods.find((m) => m.id === data.savedMethodId);
    if (!method) {
      throw new BadRequestException('Saved payment method not found');
    }

    // Prepare order details. Forces the paymentMethod to match what was saved.
    // e.g. stripe or razorpay
    const orderInput = {
      items: data.items,
      shippingAddress: data.shippingAddress,
      paymentMethod: method.brand === 'UPI' ? 'razorpay' : 'stripe',
      couponCode: data.couponCode,
      pointsRedeemed: data.pointsRedeemed,
      status: 'pending',
    };

    // 1. Create order via existing OrdersService
    const order = await this.ordersService.create(orderInput, userId);

    // 2. Mock processing of payment using saved payment token/ID
    // In a real application, you would invoke Stripe's PaymentIntent with the saved customer source token.
    console.log(`💳 Processing One-Click Checkout for User #${userId} using payment method ${method.id}`);
    
    // Simulate payment authorization
    order.status = 'paid';
    order.paymentId = `mock_one_click_${Math.random().toString(36).substr(2, 12)}`;
    
    // Save order status update
    await this.ordersService.update(order.id, {
      status: 'paid',
      paymentId: order.paymentId,
    });

    // 3. Clear user cart
    await this.cartService.syncCart(userId, undefined, []);

    return order;
  }
}
