import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column('text')
  description!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price!: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  mrp?: number;

  @Column({ default: 0 })
  discountPercent!: number;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ default: 0 })
  stock!: number;

  @Column('decimal', { precision: 3, scale: 2, default: 4.50 })
  rating!: number;

  @Column({ default: 0 })
  ratingCount!: number;

  @Column({ nullable: true })
  brand?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
