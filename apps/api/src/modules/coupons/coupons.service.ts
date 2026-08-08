import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon, CouponType } from './coupon.entity';

@Injectable()
export class CouponsService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepo: Repository<Coupon>,
  ) {}

  // ========== Admin Methods ==========

  async createCoupon(data: {
    code: string;
    type: CouponType;
    value: number;
    minOrder?: number;
    maxDiscount?: number;
    expiresAt?: Date | string;
    usageLimit?: number;
  }) {
    const codeUpper = data.code.toUpperCase();
    const existing = await this.couponRepo.findOne({ where: { code: codeUpper } });
    if (existing) {
      throw new BadRequestException('Coupon code already exists');
    }

    const coupon = this.couponRepo.create({
      code: codeUpper,
      type: data.type,
      value: data.value,
      minOrder: data.minOrder || 0,
      maxDiscount: data.maxDiscount || null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      usageLimit: data.usageLimit || 0,
      isActive: true,
      usedCount: 0,
    } as any);

    await this.couponRepo.save(coupon);
    return coupon;
  }

  async getCoupons(page: number = 1, limit: number = 20) {
    const [coupons, total] = await this.couponRepo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { coupons, total, page, limit };
  }

  async getCoupon(id: number) {
    const coupon = await this.couponRepo.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async updateCoupon(id: number, data: Partial<Coupon>) {
    const coupon = await this.getCoupon(id);
    
    if (data.code) {
      data.code = data.code.toUpperCase();
    }
    if (data.expiresAt) {
      data.expiresAt = new Date(data.expiresAt);
    }

    Object.assign(coupon, data);
    await this.couponRepo.save(coupon);
    return coupon;
  }

  async deleteCoupon(id: number) {
    await this.getCoupon(id);
    await this.couponRepo.delete(id);
    return { success: true };
  }

  async toggleCoupon(id: number) {
    const coupon = await this.getCoupon(id);
    coupon.isActive = !coupon.isActive;
    await this.couponRepo.save(coupon);
    return coupon;
  }

  // ========== Public Methods ==========

  async validateCoupon(code: string, orderTotal: number) {
    const coupon = await this.couponRepo.findOne({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      throw new BadRequestException('Invalid coupon code');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('This coupon is no longer active');
    }

    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      throw new BadRequestException('This coupon has expired');
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its usage limit');
    }

    if (orderTotal < Number(coupon.minOrder)) {
      throw new BadRequestException(`Minimum order amount is $${Number(coupon.minOrder).toFixed(2)}`);
    }

    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderTotal * Number(coupon.value)) / 100;
      if (coupon.maxDiscount && discount > Number(coupon.maxDiscount)) {
        discount = Number(coupon.maxDiscount);
      }
    } else {
      discount = Number(coupon.value);
      if (discount > orderTotal) {
        discount = orderTotal;
      }
    }

    return {
      valid: true,
      coupon,
      discount: Math.round(discount * 100) / 100,
      message: `Coupon applied! You saved $${discount.toFixed(2)}`,
    };
  }

  async applyCoupon(code: string) {
    const coupon = await this.couponRepo.findOne({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      throw new BadRequestException('Invalid coupon code');
    }
    coupon.usedCount += 1;
    await this.couponRepo.save(coupon);
    return coupon;
  }

  async getCouponStats() {
    const total = await this.couponRepo.count();
    const active = await this.couponRepo.count({ where: { isActive: true } });
    
    // Compute total used count across all coupons
    const sumResult = await this.couponRepo.createQueryBuilder('coupon')
      .select('SUM(coupon.usedCount)', 'sum')
      .getRawOne();
    
    const used = parseInt(sumResult?.sum, 10) || 0;
    return { total, active, used };
  }
}
