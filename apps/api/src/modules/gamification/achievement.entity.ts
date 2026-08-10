import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  icon?: string;

  @Column({ type: 'integer' })
  pointsReward!: number;

  @Column({ type: 'varchar', length: 50 })
  triggerType!: 'review' | 'social_share' | 'profile_complete' | 'daily_visit' | 'purchase' | 'referral';
}
