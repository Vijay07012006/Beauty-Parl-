import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export type CouponType = 'percentage' | 'fixed';

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 20 })
  type!: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value!: number;

  @Column({ name: 'min_order', type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrder!: number;

  @Column({ name: 'max_discount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscount!: number;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt!: Date;

  @Column({ name: 'usage_limit', default: 0 })
  usageLimit!: number;

  @Column({ name: 'used_count', default: 0 })
  usedCount!: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
