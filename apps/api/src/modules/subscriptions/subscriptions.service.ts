import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Subscription } from './subscription.entity';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { Address } from '../addresses/address.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Address)
    private readonly addressRepo: Repository<Address>,
  ) {}

  async create(
    productId: number,
    frequency: 'monthly' | 'quarterly' | 'bi-monthly',
    quantity: number,
    userId: number,
    paymentMethod?: string,
  ): Promise<Subscription> {
    const nextDeliveryDate = this.calculateNextDelivery(new Date(), frequency);
    const sub = this.subRepo.create({
      userId,
      productId,
      frequency,
      quantity,
      nextDeliveryDate,
      paymentMethod: paymentMethod || 'card',
      isActive: true,
    });
    return this.subRepo.save(sub);
  }

  async list(userId: number): Promise<Subscription[]> {
    return this.subRepo.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, frequency: 'monthly' | 'quarterly' | 'bi-monthly', quantity: number, userId: number): Promise<Subscription> {
    const sub = await this.subRepo.findOneOrFail({ where: { id, userId } });
    sub.frequency = frequency;
    sub.quantity = quantity;
    sub.nextDeliveryDate = this.calculateNextDelivery(new Date(), frequency);
    return this.subRepo.save(sub);
  }

  async cancel(id: number, userId: number): Promise<void> {
    await this.subRepo.delete({ id, userId });
  }

  private calculateNextDelivery(from: Date, frequency: 'monthly' | 'quarterly' | 'bi-monthly'): Date {
    const date = new Date(from);
    if (frequency === 'monthly') {
      date.setDate(date.getDate() + 30);
    } else if (frequency === 'bi-monthly') {
      date.setDate(date.getDate() + 60);
    } else if (frequency === 'quarterly') {
      date.setDate(date.getDate() + 90);
    }
    return date;
  }

  @Cron('0 0 * * *')
  async checkSubscriptions() {
    console.log('⏰ Running Subscriptions Auto-Replenishment Cron Job...');
    const now = new Date();
    const dueSubs = await this.subRepo.find({
      where: {
        isActive: true,
        nextDeliveryDate: LessThanOrEqual(now),
      },
      relations: ['product', 'user'],
    });

    for (const sub of dueSubs) {
      if (!sub.product || !sub.user) continue;

      try {
        const userAddress = await this.addressRepo.findOne({
          where: { userId: sub.userId },
        });

        const addressPayload = {
          name: userAddress?.name || sub.user.name || 'Replenish Customer',
          email: sub.user.email,
          phone: userAddress?.phone || '0000000000',
          address: userAddress?.address || 'Beauty Parlé Subscription Address',
          city: userAddress?.city || 'Delhi',
          state: userAddress?.state || 'Delhi',
          pincode: userAddress?.pincode || '110001',
        };

        const totalAmount = Number(sub.product.price) * sub.quantity;

        const mockOrder = this.orderRepo.create({
          userId: sub.userId,
          items: [
            {
              productId: sub.product.id,
              name: sub.product.name,
              price: Number(sub.product.price),
              quantity: sub.quantity,
              image: sub.product.image,
            },
          ],
          subtotal: totalAmount,
          tax: 0,
          shipping: 0,
          total: totalAmount,
          paymentMethod: (sub.paymentMethod && sub.paymentMethod !== 'cod' ? sub.paymentMethod : 'razorpay') as any, // never COD
          status: 'processing',
          shippingAddress: addressPayload,
          paymentId: 'sub_auto_' + Math.random().toString(36).substring(2, 9),
        });

        await this.orderRepo.save(mockOrder);

        sub.nextDeliveryDate = this.calculateNextDelivery(now, sub.frequency);
        await this.subRepo.save(sub);

        console.log(`📦 Subscription replenished order created for User #${sub.userId} for product ${sub.product.name}`);
      } catch (err: any) {
        console.error(`Failed to auto-replenish subscription #${sub.id}:`, err.message);
      }
    }
  }
}
