import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  userId?: number;

  @Column({ nullable: true })
  userEmail?: string;

  @Column()
  action!: string; // e.g. "USER_LOGIN", "ADMIN_DELETE_USER", "ORDER_CREATED", etc.

  @Column({ type: 'text', nullable: true })
  details?: string; // JSON string or text metadata

  @Column({ name: 'ip_address', nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId?: string;

  @Column({ name: 'entity_type', nullable: true })
  entityType?: string;

  @Column({ name: 'entity_id', nullable: true })
  entityId?: number;

  @Column({ name: 'before_value', type: 'jsonb', nullable: true })
  beforeValue?: any;

  @Column({ name: 'after_value', type: 'jsonb', nullable: true })
  afterValue?: any;

  @Column({ nullable: true })
  location?: string;

  @Column({ nullable: true, default: 'success' })
  status?: string; // e.g. success/failed

  @CreateDateColumn()
  createdAt!: Date;
}
