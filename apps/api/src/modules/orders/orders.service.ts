import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { User } from '../auth/user.entity';
import { EmailService } from '../email/email.service';
import { CartService } from '../cart/cart.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private emailService: EmailService,
    private cartService: CartService,
    private loyaltyService: LoyaltyService,
    private gamificationService: GamificationService,
  ) {}

  async create(orderData: Partial<Order>): Promise<Order> {
    const order = this.orderRepo.create(orderData);
    const saved = await this.orderRepo.save(order);

    // Clear or mark cart checked out
    const email = orderData.guestEmail || (orderData.userId ? await this.getUserEmail(orderData.userId) : null);
    try {
      await this.cartService.clearOrMarkCheckedOut(orderData.userId, email || undefined);
    } catch (err: any) {
      console.error('Failed to clear cart after order creation:', err.message);
    }

    // Increment coupon usedCount if coupon code is used
    if (orderData.couponCode) {
      try {
        const couponRepo = this.orderRepo.manager.getRepository('Coupon');
        const coupon = await couponRepo.findOne({ where: { code: orderData.couponCode.toUpperCase() } });
        if (coupon) {
          coupon.usedCount = (coupon.usedCount || 0) + 1;
          await couponRepo.save(coupon);
        }
      } catch (err) {
        console.error('Failed to increment coupon usedCount:', err);
      }
    }

    // Send order confirmation
    if (email) {
      try {
        await this.emailService.sendOrderConfirmation(email, saved);
      } catch (err) {
        console.error('Failed to send order confirmation email:', err);
      }
    }

    // Award loyalty points & trigger achievements
    if (saved.userId) {
      try {
        await this.loyaltyService.recordPurchase(saved.userId, saved.total);
        await this.gamificationService.triggerAchievement(saved.userId, 'purchase');
      } catch (err: any) {
        console.error('Failed to credit loyalty points for purchase:', err.message);
      }
    }

    // Deduct redeemed points if applicable
    if (saved.userId && orderData.pointsRedeemed) {
      try {
        await this.loyaltyService.addPoints(saved.userId, -Math.abs(orderData.pointsRedeemed), `Redeemed points on checkout order #${saved.id} 🛍️`);
      } catch (err: any) {
        console.error('Failed to deduct loyalty points:', err.message);
      }
    }

    return saved;
  }

  async findAll(status?: string): Promise<Order[]> {
    const query: any = { order: { createdAt: 'DESC' } };
    if (status) {
      query.where = { status };
    }
    return this.orderRepo.find(query);
  }

  async findByUser(userId: number, status?: string): Promise<Order[]> {
    const query: any = {
      where: { userId },
      order: { createdAt: 'DESC' },
    };
    if (status) {
      query.where.status = status;
    }
    return this.orderRepo.find(query);
  }

  async findOne(id: number): Promise<Order | null> {
    return this.orderRepo.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<Order>): Promise<Order | null> {
    const originalOrder = await this.findOne(id);
    if (!originalOrder) return null;
    await this.orderRepo.update(id, data);
    const updated = await this.findOne(id);

    if (updated && data.status && originalOrder.status !== data.status) {
      const email = updated.guestEmail || (updated.userId ? await this.getUserEmail(updated.userId) : null);
      if (email) {
        try {
          await this.emailService.sendOrderStatusEmail(email, updated.id, data.status);
        } catch (err) {
          console.error('Failed to send order status update email:', err);
        }
      }
    }

    return updated;
  }

  private async getUserEmail(userId: number): Promise<string | null> {
    if (!userId) return null;
    const userRepo = this.orderRepo.manager.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    return user?.email || null;
  }
}
