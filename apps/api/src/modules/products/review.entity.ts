import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_reviews')
export class ProductReview {
  @PrimaryGeneratedColumn()
  id!: number;

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
