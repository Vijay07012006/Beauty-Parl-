import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { WishlistAlert } from './wishlist-alert.entity';
import { Product } from '../products/product.entity';
import { User } from '../auth/user.entity';
import { EmailService } from '../email/email.service';
import { CronLock } from '../subscriptions/cron-lock.entity';

@Injectable()
export class WishlistAlertsService {
  constructor(
    @InjectRepository(WishlistAlert)
    private readonly alertRepo: Repository<WishlistAlert>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(CronLock)
    private readonly lockRepo: Repository<CronLock>,
    private readonly emailService: EmailService,
  ) {}

  // Shared distributed lock (H-6) — prevents duplicate alert emails across instances
  private async acquireLock(name: string, ttlMs: number): Promise<boolean> {
    const now = new Date();
    try {
      const existing = await this.lockRepo.findOne({ where: { name } });
      if (existing) {
        if (existing.expiresAt > now) return false;
        existing.expiresAt = new Date(now.getTime() + ttlMs);
        await this.lockRepo.save(existing);
        return true;
      }
      const lock = this.lockRepo.create({
        name,
        expiresAt: new Date(now.getTime() + ttlMs),
      });
      await this.lockRepo.save(lock);
      return true;
    } catch {
      return false;
    }
  }

  private async releaseLock(name: string): Promise<void> {
    try {
      await this.lockRepo.delete({ name });
    } catch {}
  }

  async create(
    productId: number,
    alertType: 'price_drop' | 'back_in_stock',
    priceThreshold?: number,
    userId?: number,
  ): Promise<WishlistAlert> {
    if (!userId) {
      throw new Error(
        'User authentication required to configure wishlist alerts',
      );
    }

    let alert = await this.alertRepo.findOne({
      where: { userId, productId, alertType, isTriggered: false },
    });

    if (alert) {
      if (priceThreshold !== undefined) {
        alert.priceThreshold = priceThreshold;
      }
      return this.alertRepo.save(alert);
    }

    alert = this.alertRepo.create({
      userId,
      productId,
      alertType,
      priceThreshold,
      isTriggered: false,
    });

    return this.alertRepo.save(alert);
  }

  async list(userId: number): Promise<WishlistAlert[]> {
    return this.alertRepo.find({
      where: { userId, isTriggered: false },
      relations: ['product'],
    });
  }

  async delete(id: number, userId: number): Promise<void> {
    await this.alertRepo.delete({ id, userId });
  }

  @Cron('0 0 * * *') // Daily at midnight
  async checkPriceDrops() {
    console.log('⏰ Running Wishlist Alerts: Daily Price Drop Check...');
    if (!(await this.acquireLock('wishlist:price-drop', 60 * 60 * 1000))) {
      console.log(
        '⏭️ Price-drop cron skipped — lock held by another instance.',
      );
      return;
    }
    try {
      const alerts = await this.alertRepo.find({
        where: { alertType: 'price_drop', isTriggered: false },
        relations: ['product', 'user'],
      });

      for (const alert of alerts) {
        if (
          alert.product &&
          alert.user &&
          alert.priceThreshold != null &&
          Number(alert.priceThreshold) > 0
        ) {
          const currentPrice = Number(alert.product.price);
          if (currentPrice <= Number(alert.priceThreshold)) {
            try {
              // Mark triggered BEFORE sending so a crash between send & save can't cause re-emails
              alert.isTriggered = true;
              await this.alertRepo.save(alert);
              await this.emailService.sendWishlistAlertEmail(
                alert.user.email,
                alert.product,
                'price_drop',
                alert.priceThreshold,
              );
              console.log(
                `📧 Sent price drop alert to: ${alert.user.email} for ${alert.product.name}`,
              );
            } catch (err: any) {
              alert.isTriggered = false;
              await this.alertRepo.save(alert).catch(() => {});
              console.error(
                `Failed to send price drop alert email to ${alert.user.email}:`,
                err.message,
              );
            }
          }
        }
      }
    } finally {
      await this.releaseLock('wishlist:price-drop');
    }
  }

  @Cron('0 */6 * * *') // Every 6 hours
  async checkBackInStock() {
    console.log('⏰ Running Wishlist Alerts: Back In Stock Check...');
    if (!(await this.acquireLock('wishlist:back-in-stock', 60 * 60 * 1000))) {
      console.log(
        '⏭️ Back-in-stock cron skipped — lock held by another instance.',
      );
      return;
    }
    try {
      const alerts = await this.alertRepo.find({
        where: { alertType: 'back_in_stock', isTriggered: false },
        relations: ['product', 'user'],
      });

      for (const alert of alerts) {
        if (alert.product && alert.user) {
          if (alert.product.stock > 0) {
            try {
              alert.isTriggered = true;
              await this.alertRepo.save(alert);
              await this.emailService.sendWishlistAlertEmail(
                alert.user.email,
                alert.product,
                'back_in_stock',
              );
              console.log(
                `📧 Sent restock alert to: ${alert.user.email} for ${alert.product.name}`,
              );
            } catch (err: any) {
              alert.isTriggered = false;
              await this.alertRepo.save(alert).catch(() => {});
              console.error(
                `Failed to send back-in-stock alert email to ${alert.user.email}:`,
                err.message,
              );
            }
          }
        }
      }
    } finally {
      await this.releaseLock('wishlist:back-in-stock');
    }
  }
}
