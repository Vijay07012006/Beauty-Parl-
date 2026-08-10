import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { WishlistAlert } from './wishlist-alert.entity';
import { Product } from '../products/product.entity';
import { User } from '../auth/user.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class WishlistAlertsService {
  constructor(
    @InjectRepository(WishlistAlert)
    private readonly alertRepo: Repository<WishlistAlert>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async create(
    productId: number,
    alertType: 'price_drop' | 'back_in_stock',
    priceThreshold?: number,
    userId?: number,
  ): Promise<WishlistAlert> {
    if (!userId) {
      throw new Error('User authentication required to configure wishlist alerts');
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
    const alerts = await this.alertRepo.find({
      where: { alertType: 'price_drop', isTriggered: false },
      relations: ['product', 'user'],
    });

    for (const alert of alerts) {
      if (alert.product && alert.user && alert.priceThreshold) {
        const currentPrice = Number(alert.product.price);
        if (currentPrice <= Number(alert.priceThreshold)) {
          try {
            await this.emailService.sendWishlistAlertEmail(
              alert.user.email,
              alert.product,
              'price_drop',
              alert.priceThreshold,
            );
            alert.isTriggered = true;
            await this.alertRepo.save(alert);
            console.log(`📧 Sent price drop alert to: ${alert.user.email} for ${alert.product.name}`);
          } catch (err: any) {
            console.error(`Failed to send price drop alert email to ${alert.user.email}:`, err.message);
          }
        }
      }
    }
  }

  @Cron('0 */6 * * *') // Every 6 hours
  async checkBackInStock() {
    console.log('⏰ Running Wishlist Alerts: Back In Stock Check...');
    const alerts = await this.alertRepo.find({
      where: { alertType: 'back_in_stock', isTriggered: false },
      relations: ['product', 'user'],
    });

    for (const alert of alerts) {
      if (alert.product && alert.user) {
        if (alert.product.stock > 0) {
          try {
            await this.emailService.sendWishlistAlertEmail(
              alert.user.email,
              alert.product,
              'back_in_stock',
            );
            alert.isTriggered = true;
            await this.alertRepo.save(alert);
            console.log(`📧 Sent restock alert to: ${alert.user.email} for ${alert.product.name}`);
          } catch (err: any) {
            console.error(`Failed to send back-in-stock alert email to ${alert.user.email}:`, err.message);
          }
        }
      }
    }
  }
}
