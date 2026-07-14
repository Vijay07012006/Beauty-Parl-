import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  userId!: number;

  @Column({ nullable: true })
  guestEmail!: string;

  @Column('jsonb')
  items!: any[]; // [{ productId, name, price, quantity, image }]

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tax!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  shipping!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total!: number;

  @Column()
  paymentMethod!: 'cod' | 'razorpay' | 'stripe';

  @Column({ default: 'pending' })
  status!: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

  @Column('jsonb')
  shippingAddress!: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  };

  @Column({ nullable: true })
  paymentId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
