import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('creator_looks')
export class CreatorLook {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  title!: string;

  @Column({ type: 'varchar', length: 500 })
  imageUrl!: string;

  @Column('simple-json')
  taggedProductIds!: number[];

  @Column({ default: 0 })
  clicksCount!: number;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status!: 'pending' | 'approved' | 'rejected';

  @CreateDateColumn()
  createdAt!: Date;
}
