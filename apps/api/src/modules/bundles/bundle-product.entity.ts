import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Bundle } from './bundle.entity';
import { Product } from '../products/product.entity';

@Entity('bundle_products')
export class BundleProduct {
  @PrimaryColumn()
  bundleId!: number;

  @PrimaryColumn()
  productId!: number;

  @ManyToOne(() => Bundle, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bundleId' })
  bundle?: Bundle;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product?: Product;
}
