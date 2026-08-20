import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/user.entity';

@Entity('forum_categories')
export class ForumCategory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('forum_threads')
export class Thread {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  categoryId!: number;

  @Column()
  userId!: number;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => ForumCategory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'categoryId' })
  category?: ForumCategory;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}

@Entity('forum_replies')
export class Reply {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  threadId!: number;

  @Column()
  userId!: number;

  @Column({ type: 'text' })
  content!: string;

  @Column({ default: false })
  isHidden!: boolean;

  @Column({ default: false })
  isModerated!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => Thread, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'threadId' })
  thread?: Thread;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
