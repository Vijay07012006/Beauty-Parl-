import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('active_sessions')
export class ActiveSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column({ name: 'session_id', unique: true })
  sessionId!: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn({ name: 'login_time' })
  loginTime!: Date;

  @UpdateDateColumn({ name: 'last_activity' })
  lastActivity!: Date;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  location?: string;
}
