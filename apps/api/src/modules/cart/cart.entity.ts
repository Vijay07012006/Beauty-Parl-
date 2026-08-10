import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  userId?: number;

  @Column({ nullable: true })
  email?: string;

  @Column('jsonb')
  items!: any[]; // [{ id, name, price, quantity, image, maxStock }]

  @Column({ default: true })
  isAbandoned!: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  cartAbandonedAt!: Date;

  @Column({ default: false })
  reminderSent!: boolean;

  @Column({ default: false })
  followUpSent!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
