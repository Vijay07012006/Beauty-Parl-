import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/user.entity';

@Entity('ai_generations')
export class AiGeneration {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', nullable: true })
  userId?: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @Column()
  type!: 'page' | 'image' | 'chart' | 'widget';

  @Column('jsonb')
  content!: any;

  @Column({ name: 'preview_url', nullable: true })
  previewUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
