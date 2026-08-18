import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Not } from 'typeorm';
import { FraudAlert } from './fraud-alert.entity';
import { Order } from '../orders/order.entity';
import { UserSession } from '../auth/user-session.entity';
import { User } from '../auth/user.entity';

@Injectable()
export class FraudDetectionService {
  private readonly disposableDomains = [
    'mailinator.com',
    'yopmail.com',
    'tempmail.com',
    'dispostable.com',
    'sharklasers.com',
    'guerrillamail.com',
    '10minutemail.com',
    'trashmail.com',
  ];

  constructor(
    @InjectRepository(FraudAlert)
    private fraudAlertRepo: Repository<FraudAlert>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(UserSession)
    private sessionRepo: Repository<UserSession>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async checkOrder(
    order: Order,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<{
    score: number;
    reason: string;
    status: 'pending' | 'confirmed' | 'false_positive' | 'reviewed';
  }> {
    let score = 0;
    const flags: string[] = [];
    const userId = order.userId;
    const email =
      order.guestEmail || (userId ? await this.getUserEmail(userId) : '');

    // 1. Unusual order amount (> 3x average user spending)
    if (userId) {
      const avgResult = await this.orderRepo
        .createQueryBuilder('order')
        .select('AVG(order.total)', 'avg')
        .where('order.userId = :userId AND order.id != :orderId', {
          userId,
          orderId: order.id,
        })
        .getRawOne();

      const averageSpending = parseFloat(avgResult?.avg || '0');
      if (averageSpending > 0 && order.total > averageSpending * 3) {
        score += 30;
        flags.push(
          `Unusual order amount (${order.total} is > 3x avg of ${averageSpending.toFixed(2)})`,
        );
      }
    }

    // 2. Multiple orders (> 5 orders in 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await this.orderRepo.count({
      where: [
        {
          userId: userId || -1,
          createdAt: Between(tenMinutesAgo, new Date()),
          id: Not(order.id),
        },
        {
          guestEmail: email || 'none',
          createdAt: Between(tenMinutesAgo, new Date()),
          id: Not(order.id),
        },
      ],
    });
    if (recentCount >= 5) {
      score += 40;
      flags.push(`Multiple orders (${recentCount} orders in last 10 minutes)`);
    }

    // 3. Shipping address mismatch (different from previous orders)
    if (userId) {
      const previousOrder = await this.orderRepo.findOne({
        where: { userId, id: Not(order.id) },
        order: { createdAt: 'DESC' },
      });
      if (previousOrder && previousOrder.shippingAddress) {
        const addr1 = order.shippingAddress;
        const addr2 = previousOrder.shippingAddress;
        if (
          addr1.address !== addr2.address ||
          addr1.city !== addr2.city ||
          addr1.pincode !== addr2.pincode
        ) {
          score += 15;
          flags.push('Shipping address mismatch with previous orders');
        }
      }
    }

    // 4. New device/IP (login from unknown device)
    if (userId && (ipAddress || userAgent)) {
      const knownSessions = await this.sessionRepo.count({
        where: {
          userId,
          ipAddress: ipAddress || undefined,
          userAgent: userAgent || undefined,
        },
      });
      if (knownSessions === 0) {
        score += 15;
        flags.push('Order placed from new/unknown device or IP address');
      }
    }

    // 5. High risk email domain
    if (email) {
      const domain = email.split('@')[1]?.toLowerCase();
      if (this.disposableDomains.includes(domain)) {
        score += 30;
        flags.push(`Disposable/throwaway email domain (${domain})`);
      }
    }

    const reason = flags.join('; ') || 'No suspicious activity detected';
    let status: 'pending' | 'confirmed' | 'false_positive' | 'reviewed' =
      'pending';

    if (score > 90) {
      status = 'confirmed';
    } else if (score > 70) {
      status = 'pending';
    } else {
      status = 'false_positive';
    }

    // Save alert if flagged (score > 70)
    if (score > 70) {
      const alert = this.fraudAlertRepo.create({
        orderId: order.id,
        userId: userId || undefined,
        reason,
        confidenceScore: score,
        status,
      });
      await this.fraudAlertRepo.save(alert);
    }

    return { score, reason, status };
  }

  private async getUserEmail(userId: number): Promise<string> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: { email: true },
    });
    return user?.email || '';
  }
}
