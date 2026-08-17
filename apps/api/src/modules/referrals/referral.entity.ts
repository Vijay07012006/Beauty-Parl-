import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  referrerId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referrerId' })
  referrer?: User;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Column({ type: 'boolean', default: false, name: 'reward_claimed' })
  rewardClaimed!: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'reward_amount' })
  rewardAmount!: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
