import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  storeName!: string;

  @Column()
  businessRegNumber!: string;

  @Column('decimal', { precision: 5, scale: 2, default: 15.0 })
  commissionRate!: number;

  @Column({ default: 'pending' })
  status!: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn()
  createdAt!: Date;
}
