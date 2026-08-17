import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../auth/user.entity';

@Entity('deletion_requests')
export class DeletionRequest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ length: 255 })
  email!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'pending'
  })
  status!: 'pending' | 'processing' | 'completed' | 'failed';

  @CreateDateColumn({ name: 'requested_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  requestedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;
}
