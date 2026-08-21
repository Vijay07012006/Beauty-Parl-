import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('wholesale_orders')
export class WholesaleOrder {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  vendorId!: number;

  @Column('jsonb')
  items!: any[]; // [{ productId, name, price, quantity }]

  @Column('decimal', { precision: 10, scale: 2 })
  total!: number;

  @Column({ default: 'pending' })
  status!: 'pending' | 'approved' | 'delivered';

  @CreateDateColumn()
  createdAt!: Date;
}
