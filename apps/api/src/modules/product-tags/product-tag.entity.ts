import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export type TagCategory = 'ingredient' | 'benefit' | 'concern';

@Entity('product_tags')
export class ProductTag {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, length: 50 })
  name!: string;

  @Column({ nullable: true, length: 50 })
  icon?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category?: TagCategory;
}
