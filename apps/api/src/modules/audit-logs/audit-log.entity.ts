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

  @Column({ nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
