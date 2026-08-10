import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Look } from './look.entity';
import { Product } from '../products/product.entity';

@Entity('look_products')
export class LookProduct {
  @PrimaryColumn()
  lookId!: number;

  @PrimaryColumn()
  productId!: number;

  @Column({ default: 0 })
  position!: number;

  @ManyToOne(() => Look, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lookId' })
  look?: Look;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product?: Product;
}
