import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from './order.entity';
import { User } from '../auth/user.entity';
import { Product } from '../products/product.entity';
import { Coupon } from '../coupons/coupon.entity';
import { EmailService } from '../email/email.service';
import { CartService } from '../cart/cart.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { GamificationService } from '../gamification/gamification.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(Coupon)
    private couponRepo: Repository<Coupon>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private emailService: EmailService,
    private cartService: CartService,
    private loyaltyService: LoyaltyService,
    private gamificationService: GamificationService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(orderData: Partial<Order>): Promise<Order> {
    // ========== SERVER-SIDE PRICE & STOCK VALIDATION (prevents price tampering) ==========
    const rawItems = Array.isArray(orderData.items) ? orderData.items : [];
    const productIds = rawItems
      .map((i: any) => Number(i?.productId))
      .filter((id: any) => Number.isInteger(id) && id > 0);

    const products = productIds.length
      ? await this.productRepo.find({ where: { id: In(productIds) } })
      : [];
    const productMap = new Map(products.map((p) => [p.id, p]));

    const validatedItems: any[] = [];
    let subtotal = 0;
    for (const item of rawItems) {
      const product = productMap.get(Number(item?.productId));
      if (!product) {
        throw new BadRequestException(`Product with ID ${item?.productId} not found`);
      }
      const qty = Math.max(1, Math.floor(Number(item?.quantity) || 1));
      const available = Number(product.stock);
      if (!isNaN(available) && available < qty) {
        throw new BadRequestException(`Insufficient stock for ${product.name}`);
      }
      subtotal += Number(product.price) * qty;
      validatedItems.push({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        quantity: qty,
        image: product.image,
      });
    }

    subtotal = round2(subtotal);
    const tax = round2(subtotal * 0.1);
    const shipping = subtotal > 50 ? 0 : 5;

    // ========== COUPON SERVER-SIDE VALIDATION ==========
    let discount = 0;
    if (orderData.couponCode) {
      const coupon = await this.couponRepo.findOne({
        where: { code: String(orderData.couponCode).toUpperCase() },
      });
      if (!coupon || !coupon.isActive) {
        throw new BadRequestException('Invalid coupon code');
      }
      if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
        throw new BadRequestException('This coupon has expired');
      }
      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
        throw new BadRequestException('This coupon has reached its usage limit');
      }
      if (subtotal < Number(coupon.minOrder)) {
        throw new BadRequestException(`Minimum order amount is ${Number(coupon.minOrder).toFixed(2)}`);
      }
      if (coupon.type === 'percentage') {
        discount = (subtotal * Number(coupon.value)) / 100;
        if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
          discount = Number(coupon.maxDiscount);
        }
      } else {
        discount = Number(coupon.value);
        if (discount > subtotal) discount = subtotal;
      }
      discount = round2(discount);
    }

    // ========== LOYALTY POINTS REDEMPTION VALIDATION ==========
    let pointsRedeemed = 0;
    if (orderData.userId && Number(orderData.pointsRedeemed) > 0) {
      const user = await this.userRepo.findOne({ where: { id: orderData.userId } });
      if (user) {
        pointsRedeemed = Math.min(
          Math.floor(Number(orderData.pointsRedeemed)),
          Math.round(subtotal),
          Number(user.loyaltyPoints) || 0,
        );
      }
    }

    const total = Math.max(0, round2(subtotal + tax + shipping - discount - pointsRedeemed));

    const order = this.orderRepo.create({
      ...orderData,
      items: validatedItems,
      subtotal,
      tax,
      shipping,
      total,
      discount,
      pointsRedeemed,
    });
    const saved = await this.orderRepo.save(order);

    // ========== DECREMENT STOCK ==========
    for (const item of validatedItems) {
      const product = productMap.get(item.productId)!;
      const available = Number(product.stock);
      if (!isNaN(available)) {
        await this.productRepo.decrement({ id: product.id }, 'stock', item.quantity);
      }
    }

    // Clear or mark cart checked out
    const email = orderData.guestEmail || (orderData.userId ? await this.getUserEmail(orderData.userId) : null);
    await this.auditLogsService.log('ORDER_CREATED', email || undefined, saved.userId || undefined, { orderId: saved.id, total: saved.total });
    
    try {
      await this.cartService.clearOrMarkCheckedOut(orderData.userId, email || undefined);
    } catch (err: any) {
      console.error('Failed to clear cart after order creation:', err.message);
    }

    // Atomic coupon usedCount increment — prevents race-condition double-use (Fix 22)
    if (orderData.couponCode) {
      try {
        const coupon = await this.couponRepo.findOne({
          where: { code: String(orderData.couponCode).toUpperCase() },
        });
        if (coupon) {
          await this.couponRepo
            .createQueryBuilder()
            .update(Coupon)
            .set({ usedCount: () => 'usedCount + 1' })
            .where('id = :id', { id: coupon.id })
            .andWhere('(usageLimit = 0 OR usedCount < usageLimit)')
            .execute();
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
    if (saved.userId && pointsRedeemed > 0) {
      try {
        await this.loyaltyService.addPoints(saved.userId, -pointsRedeemed, `Redeemed points on checkout order #${saved.id} 🛍️`);
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
      await this.auditLogsService.log('ORDER_STATUS_CHANGED', email || undefined, updated.userId || undefined, { orderId: updated.id, oldStatus: originalOrder.status, newStatus: data.status });
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
