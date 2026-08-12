import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/user.entity';

@Entity('ai_conversations')
export class AiConversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', nullable: true })
  userId?: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column({ name: 'session_id', nullable: true })
  sessionId?: string;

  @Column()
  role!: 'user' | 'assistant' | 'system' | 'tool';

  @Column('text', { nullable: true })
  content?: string;

  @Column('jsonb', { name: 'tool_calls', nullable: true })
  toolCalls?: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
