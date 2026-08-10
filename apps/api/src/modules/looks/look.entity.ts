import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('looks')
export class Look {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ unique: true, length: 255 })
  slug!: string;

  @Column({ nullable: true, length: 500 })
  imageUrl?: string;

  @Column({ nullable: true, length: 100 })
  occasion?: string;

  @Column({ nullable: true, length: 50 })
  skinType?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
