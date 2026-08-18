import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Referral } from './referral.entity';

@Entity('referral_tracking')
export class ReferralTracking {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  referralId!: number;

  @ManyToOne(() => Referral, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'referralId' })
  referral?: Referral;

  @Column({ type: 'varchar', length: 255 })
  referredEmail!: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: 'pending' | 'joined' | 'completed';

  @Column({ default: false })
  rewardClaimed!: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
