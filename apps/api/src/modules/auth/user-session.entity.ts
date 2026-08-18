import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'session_id', unique: true })
  sessionId!: string;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'device_type', length: 50, nullable: true })
  deviceType?: string;

  @CreateDateColumn({
    name: 'login_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  loginTime!: Date;

  @UpdateDateColumn({
    name: 'last_activity',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastActivity!: Date;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}
