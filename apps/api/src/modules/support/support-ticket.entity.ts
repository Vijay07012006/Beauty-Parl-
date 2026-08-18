import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../auth/user.entity';
import { Order } from '../orders/order.entity';

@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'user_id', nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ type: 'varchar', length: 255, name: 'guest_email', nullable: true })
  guestEmail!: string | null;

  @Column({ type: 'int', name: 'order_id', nullable: true })
  orderId!: number | null;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order!: Order | null;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'open',
  })
  status!: 'open' | 'in_progress' | 'resolved' | 'closed';

  @Column({
    type: 'varchar',
    length: 20,
    default: 'medium',
  })
  priority!: 'low' | 'medium' | 'high';

  @Column({ type: 'int', name: 'assigned_to', nullable: true })
  assignedTo!: number | null;

  @Column({ type: 'text', name: 'ai_summary', nullable: true })
  aiSummary!: string | null;

  @Column({ type: 'timestamp', name: 'resolved_at', nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
