import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column({ name: 'token_hash' })
  tokenHash!: string;

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent?: string;

  @UpdateDateColumn({ name: 'last_activity_at' })
  lastActivityAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
