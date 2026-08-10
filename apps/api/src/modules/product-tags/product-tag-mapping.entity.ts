import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../products/product.entity';
import { ProductTag } from './product-tag.entity';

@Entity('product_tag_mapping')
export class ProductTagMapping {
  @PrimaryColumn()
  productId!: number;

  @PrimaryColumn()
  tagId!: number;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product?: Product;

  @ManyToOne(() => ProductTag, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tagId' })
  tag?: ProductTag;
}
