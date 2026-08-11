import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Cart } from './cart.entity';
import { Product } from '../products/product.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepo: Repository<Cart>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private emailService: EmailService,
  ) {}

  /**
   * Server-side cart item validation (P5): client prices/names/images are discarded —
   * every item is re-resolved from the DB, quantities are clamped to stock & capped.
   */
  private async validateItems(items: any[]): Promise<any[]> {
    if (!Array.isArray(items)) return [];

    const qtyMap = new Map<number, number>();
    for (const item of items) {
      const pid = Number(item?.productId ?? item?.id);
      const qty = Math.floor(Number(item?.quantity) || 1);
      if (!Number.isInteger(pid) || pid <= 0 || qty <= 0) continue;
      // cap per-product quantity at stock (resolved below) or 100
      qtyMap.set(pid, (qtyMap.get(pid) || 0) + Math.min(qty, 100));
    }

    if (qtyMap.size === 0) return [];

    const products = await this.productRepo.find({ where: { id: In([...qtyMap.keys()]) } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const validated: any[] = [];
    for (const [pid, qty] of qtyMap.entries()) {
      const product = productMap.get(pid);
      if (!product) continue;
      const stock = Number(product.stock);
      const finalQty = !isNaN(stock) && stock < qty ? Math.max(1, stock) : qty;
      validated.push({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: finalQty,
        image: product.image,
        maxStock: stock,
      });
    }
    return validated;
  }

  async syncCart(userId: number | undefined, email: string | undefined, items: any[]): Promise<Cart> {
    // Client-supplied prices/quantities/names are NEVER trusted — re-resolve from DB (P5)
    const validatedItems = await this.validateItems(items);

    if (validatedItems.length === 0) {
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
        items: validatedItems,
        isAbandoned: true,
        reminderSent: false,
        followUpSent: false,
      });
    } else {
      cart.items = validatedItems;
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
