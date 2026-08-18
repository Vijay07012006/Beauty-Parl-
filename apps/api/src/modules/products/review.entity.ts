import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_reviews')
@Unique(['userId', 'productId']) // one review per user per product (P1)
export class ProductReview {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @Column({ nullable: true })
  userId!: number;

  @Index()
  @Column()
  productId!: number;

  @Column()
  reviewerName!: string;

  @Column('int')
  rating!: number;

  @Column('text')
  comment!: string;

  @Column({ default: false })
  isApproved!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product?: Product;
}
