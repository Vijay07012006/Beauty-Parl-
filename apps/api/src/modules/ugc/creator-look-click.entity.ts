import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('creator_look_clicks')
export class CreatorLookClick {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  userId?: number;

  @Column()
  visitorId!: string;

  @Column()
  lookId!: number;

  @Column()
  productId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
