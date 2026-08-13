import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', nullable: true })
  userId!: number | null;

  @Column({ name: 'guest_email', nullable: true })
  guestEmail!: string | null;

  @Column({ name: 'order_id', nullable: true })
  orderId!: number | null;

  @Column()
  subject!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ default: 'open' })
  status!: 'open' | 'in_progress' | 'resolved' | 'closed';

  @Column({ default: 'medium' })
  priority!: 'low' | 'medium' | 'high';

  @Column({ name: 'assigned_to', nullable: true })
  assignedTo!: number | null;

  @Column({ name: 'ai_summary', type: 'text', nullable: true })
  aiSummary!: string | null;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
