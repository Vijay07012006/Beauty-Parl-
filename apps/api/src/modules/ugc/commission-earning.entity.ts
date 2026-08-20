import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('commission_earnings')
export class CommissionEarning {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  sourceLookId!: number;

  @Column()
  orderId!: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: 'pending' | 'paid';

  @CreateDateColumn()
  createdAt!: Date;
}
