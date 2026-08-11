import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { Product } from '../products/product.entity';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  productId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @Column({ type: 'varchar', length: 20 })
  frequency!: 'monthly' | 'quarterly' | 'bi-monthly';

  @Column({ type: 'integer', default: 1 })
  quantity!: number;

  @Column({ type: 'varchar', length: 20, default: 'card' })
  paymentMethod!: string;

  @Column({ type: 'timestamp' })
  nextDeliveryDate!: Date;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
