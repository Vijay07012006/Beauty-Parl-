import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Cart } from './cart.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,
    private emailService: EmailService,
  ) {}

  async syncCart(userId: number | undefined, email: string | undefined, items: any[]): Promise<Cart> {
    if (items.length === 0) {
      const cart = await this.findActiveCart(userId, email);
      if (cart) {
        cart.items = [];
        cart.isAbandoned = false;
        return this.cartRepo.save(cart);
      }
    }

    let cart = await this.findActiveCart(userId, email);
    if (!cart) {
      cart = this.cartRepo.create({
        userId,
        email,
        items,
        isAbandoned: true,
        reminderSent: false,
        followUpSent: false,
      });
    } else {
      cart.items = items;
      cart.isAbandoned = true;
      cart.reminderSent = false;
      cart.followUpSent = false;
      cart.cartAbandonedAt = new Date();
    }

    return this.cartRepo.save(cart);
  }

  async clearOrMarkCheckedOut(userId?: number, email?: string): Promise<void> {
    const cart = await this.findActiveCart(userId, email);
    if (cart) {
      cart.isAbandoned = false;
      await this.cartRepo.save(cart);
    }
  }

  async findActiveCart(userId?: number, email?: string): Promise<Cart | null> {
    if (userId) {
      return this.cartRepo.findOne({ where: { userId, isAbandoned: true } });
    }
    if (email) {
      return this.cartRepo.findOne({ where: { email, isAbandoned: true } });
    }
    return null;
  }

  @Cron('0 */10 * * * *') // Run every 10 minutes
  async processAbandonedCarts() {
    console.log('⏰ Running Abandoned Cart Recovery Cron Job...');
    const now = new Date();

    // 1. Recovery Reminder after 2 hours
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const cartsToRemind = await this.cartRepo.find({
      where: {
        isAbandoned: true,
        reminderSent: false,
        cartAbandonedAt: LessThan(twoHoursAgo),
      },
    });

    for (const cart of cartsToRemind) {
      const email = cart.email || (cart.userId ? await this.getUserEmail(cart.userId) : null);
      if (email && cart.items && cart.items.length > 0) {
        try {
          await this.emailService.sendCartReminderEmail(email, cart.items);
          cart.reminderSent = true;
          await this.cartRepo.save(cart);
          console.log(`📧 Sent 2-hour cart reminder to: ${email}`);
        } catch (err: any) {
          console.error(`Failed to send 2-hour cart reminder to ${email}:`, err.message);
        }
      }
    }

    // 2. Follow-up discount offer after 24 hours
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const cartsToOfferDiscount = await this.cartRepo.find({
      where: {
        isAbandoned: true,
        reminderSent: true,
        followUpSent: false,
        cartAbandonedAt: LessThan(twentyFourHoursAgo),
      },
    });

    for (const cart of cartsToOfferDiscount) {
      const email = cart.email || (cart.userId ? await this.getUserEmail(cart.userId) : null);
      if (email && cart.items && cart.items.length > 0) {
        try {
          await this.emailService.sendCartReminderEmail(email, cart.items, 'RECOVER10');
          cart.followUpSent = true;
          await this.cartRepo.save(cart);
          console.log(`📧 Sent 24-hour cart discount to: ${email}`);
        } catch (err: any) {
          console.error(`Failed to send 24-hour cart discount to ${email}:`, err.message);
        }
      }
    }
  }

  private async getUserEmail(userId: number): Promise<string | null> {
    try {
      const userRepo = this.cartRepo.manager.getRepository('User');
      const user = await userRepo.findOne({ where: { id: userId } });
      return user ? (user as any).email : null;
    } catch {
      return null;
    }
  }
}
