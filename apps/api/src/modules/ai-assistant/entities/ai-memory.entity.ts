import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/user.entity';

@Entity('ai_memory')
export class AiMemory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', name: 'user_id', nullable: true })
  userId!: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User | null;

  @Column({ type: 'varchar', length: 100, name: 'session_id', nullable: true })
  sessionId!: string | null;

  @Column({ type: 'text', nullable: true })
  question!: string | null;

  @Column({ type: 'text', nullable: true })
  answer!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  context!: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
