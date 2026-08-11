import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
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
    private dataSource: DataSource,
  ) {}

  /**
   * Creates an order with strictly whitelisted client input.
   * - `userId` is derived from the authenticated JWT (never from the body) — O1
   * - `status` is forced to 'pending' — a client can never mark an order paid (O1)
   * - prices/totals are recomputed server-side from DB product prices
   * - stock & coupon usage are reserved atomically inside a transaction (O2/O3/O4/O5)
   */
  async create(orderData: any, userId?: number): Promise<Order> {
    // ========== STRICT INPUT WHITELIST (no mass assignment) ==========
    const rawItems = Array.isArray(orderData?.items) ? orderData.items : [];
    const couponCode = typeof orderData?.couponCode === 'string' ? orderData.couponCode.trim().toUpperCase() : undefined;
    const guestEmail = typeof orderData?.guestEmail === 'string' ? orderData.guestEmail.trim().toLowerCase() : undefined;
    const shippingAddress = orderData?.shippingAddress;
    const paymentMethod = orderData?.paymentMethod;
    const requestedPoints = Number(orderData?.pointsRedeemed) || 0;

    // Validate guest email format (prevents order-confirmation email bombing)
    if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      throw new BadRequestException('Invalid guest email format');
    }

    if (!shippingAddress || typeof shippingAddress !== 'object') {
      throw new BadRequestException('Shipping address is required');
    }

    if (!paymentMethod || !['cod', 'razorpay', 'stripe'].includes(paymentMethod)) {
      throw new BadRequestException('Invalid payment method');
    }

    // ========== SERVER-SIDE PRICE VALIDATION (prevents price tampering) ==========
    // Aggregate duplicate productIds so per-product stock checks can't be bypassed (O4)
    const qtyMap = new Map<number, number>();
    for (const item of rawItems) {
      const pid = Number(item?.productId);
      const qty = Math.max(1, Math.floor(Number(item?.quantity) || 1));
      if (!Number.isInteger(pid) || pid <= 0) {
        throw new BadRequestException('Invalid product id in items');
      }
      if (qty > 100) {
        throw new BadRequestException(`Quantity for product ${pid} exceeds the maximum allowed (100)`);
      }
      qtyMap.set(pid, (qtyMap.get(pid) || 0) + qty);
    }

    const productIds = [...qtyMap.keys()];
    const products = productIds.length
      ? await this.productRepo.find({ where: { id: In(productIds) } })
      : [];
    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products were not found');
    }
    const productMap = new Map(products.map((p) => [p.id, p]));

    const validatedItems: any[] = [];
    let subtotal = 0;
    for (const [pid, qty] of qtyMap.entries()) {
      const product = productMap.get(pid)!;
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

    return this.dataSource.transaction(async (em) => {
      // ========== COUPON SERVER-SIDE VALIDATION ==========
      let discount = 0;
      if (couponCode) {
        const coupon = await em.findOne(Coupon, {
          where: { code: couponCode },
        });
        if (!coupon || !coupon.isActive) {
          throw new BadRequestException('Invalid coupon code');
        }
        if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
          throw new BadRequestException('This coupon has expired');
        }
        if (subtotal < Number(coupon.minOrder)) {
          throw new BadRequestException(`Minimum order amount is ${Number(coupon.minOrder).toFixed(2)}`);
        }

        // Reserve coupon usage ATOMICALLY before granting the discount (O5)
        const reserveResult = await em
          .createQueryBuilder()
          .update(Coupon)
          .set({ usedCount: () => 'usedCount + 1' })
          .where('id = :id', { id: coupon.id })
          .andWhere('(usageLimit = 0 OR usedCount < usageLimit)')
          .execute();
        if (!reserveResult.affected || reserveResult.affected === 0) {
          throw new BadRequestException('This coupon has reached its usage limit');
        }

        if (coupon.type === 'percentage') {
          discount = (subtotal * Number(coupon.value)) / 100;
          if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
            discount = Number(coupon.maxDiscount);
          }
          // Never allow a percentage coupon to exceed the subtotal (O7)
          if (discount > subtotal) discount = subtotal;
        } else {
          discount = Number(coupon.value);
          if (discount > subtotal) discount = subtotal;
        }
        discount = round2(discount);
      }

      // ========== LOYALTY POINTS REDEMPTION (only for the authenticated user) ==========
      let pointsRedeemed = 0;
      if (userId && requestedPoints > 0) {
        const user = await em.findOne(User, {
          where: { id: userId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!user) throw new ForbiddenException('User not found');
        pointsRedeemed = Math.min(
          Math.floor(requestedPoints),
          Math.round(subtotal),
          Number(user.loyaltyPoints) || 0,
        );
        if (pointsRedeemed > 0) {
          user.loyaltyPoints = Number(user.loyaltyPoints) - pointsRedeemed;
          await em.save(user);
        }
      }

      const total = Math.max(0, round2(subtotal + tax + shipping - discount - pointsRedeemed));

      // ========== ATOMIC STOCK RESERVATION (no oversell, no negative stock) ==========
      for (const item of validatedItems) {
        const result = await em
          .createQueryBuilder()
          .update(Product)
          .set({ stock: () => 'stock - :qty' })
          .where('id = :id AND stock >= :qty', { id: item.productId, qty: item.quantity })
          .execute();
        if (!result.affected || result.affected === 0) {
          throw new BadRequestException(`Insufficient stock for product id ${item.productId}`);
        }
      }

      const order = em.create(Order, {
        items: validatedItems,
        subtotal,
        tax,
        shipping,
        total,
        discount,
        pointsRedeemed,
        couponCode,
        guestEmail,
        shippingAddress,
        paymentMethod,
        userId: userId || undefined,
        status: 'pending', // ALWAYS start pending — payment verified via webhook
      });
      const saved = await em.save(order);

      // Clear or mark cart checked out (best-effort, outside stock/price correctness)
      const email = guestEmail || (userId ? await this.getUserEmail(userId) : null);
      try {
        await this.cartService.clearOrMarkCheckedOut(userId, email || undefined);
      } catch (err: any) {
        console.error('Failed to clear cart after order creation:', err.message);
      }

      await this.auditLogsService.log('ORDER_CREATED', email || undefined, saved.userId || undefined, { orderId: saved.id, total: saved.total });

      // Send order confirmation (best-effort, non-blocking)
      if (email) {
        try {
          await this.emailService.sendOrderConfirmation(email, saved);
        } catch (err) {
          console.error('Failed to send order confirmation email:', err);
        }
      }

      // Award loyalty points ONLY after the order is created for the authenticated user,
      // and ONLY once (inside the transaction). Note: recordPurchase uses its own pessimistic
      // lock on the same row we already updated — that is fine because they are sequential here.
      if (saved.userId) {
        try {
          await this.loyaltyService.recordPurchase(saved.userId, saved.total);
          await this.gamificationService.triggerAchievement(saved.userId, 'purchase');
        } catch (err: any) {
          console.error('Failed to credit loyalty points for purchase:', err.message);
        }
      }

      return saved;
    });
  }

  /** Restores stock when an order is cancelled (O2 rollback) */
  async restoreStock(order: Order): Promise<void> {
    if (!Array.isArray(order.items)) return;
    for (const item of order.items) {
      const pid = Number(item?.productId);
      const qty = Math.max(1, Math.floor(Number(item?.quantity) || 1));
      if (!Number.isInteger(pid) || pid <= 0) continue;
      await this.productRepo.increment({ id: pid }, 'stock', qty);
    }
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

    // Restore stock when an order is cancelled (O2 rollback)
    if (updated && data.status === 'cancelled' && originalOrder.status !== 'cancelled') {
      await this.restoreStock(originalOrder);
    }

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
