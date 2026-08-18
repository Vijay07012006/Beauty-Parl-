import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Waitlist } from './waitlist.entity';
import { Product } from '../products/product.entity';
import { EmailService } from '../email/email.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class WaitlistService {
  constructor(
    @InjectRepository(Waitlist)
    private readonly waitlistRepo: Repository<Waitlist>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    private readonly emailService: EmailService,
  ) {}

  async joinWaitlist(userId: number, productId: number): Promise<Waitlist> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    if (product.stock > 0) {
      throw new BadRequestException(
        'Product is already in stock; you can buy it directly',
      );
    }

    const existing = await this.waitlistRepo.findOne({
      where: { userId, productId },
    });
    if (existing) {
      return existing;
    }

    const entry = this.waitlistRepo.create({ userId, productId });
    return this.waitlistRepo.save(entry);
  }

  async checkStatus(
    userId: number,
    productId: number,
  ): Promise<{ onWaitlist: boolean }> {
    const entry = await this.waitlistRepo.findOne({
      where: { userId, productId },
    });
    return { onWaitlist: !!entry };
  }

  // Daily check of restocked items to notify waitlisted users
  @Cron('0 0 * * *')
  async checkRestockedItems() {
    console.log('⏰ Running Waitlist: Restocked Items Check...');
    try {
      const waitlistEntries = await this.waitlistRepo.find({
        relations: ['product', 'user'],
      });

      for (const entry of waitlistEntries) {
        if (entry.product && entry.user && entry.product.stock > 0) {
          try {
            await this.emailService.sendWishlistAlertEmail(
              entry.user.email,
              entry.product,
              'back_in_stock',
            );
            console.log(
              `📧 Waitlist Restock alert email sent to: ${entry.user.email} for product: ${entry.product.name}`,
            );

            // Delete waitlist entry once notified
            await this.waitlistRepo.delete(entry.id);
          } catch (err: any) {
            console.error(
              `Failed to send waitlist restock email to ${entry.user.email}:`,
              err.message,
            );
          }
        }
      }
    } catch (err: any) {
      console.error('Waitlist cron check error:', err.message);
    }
  }
}
