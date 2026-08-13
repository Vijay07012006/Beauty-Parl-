import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('ticket_replies')
export class TicketReply {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'ticket_id' })
  ticketId!: number;

  @Column({ name: 'user_id', nullable: true })
  userId!: number | null;

  @Column({ name: 'is_admin', default: false })
  isAdmin!: boolean;

  @Column({ type: 'text' })
  message!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
