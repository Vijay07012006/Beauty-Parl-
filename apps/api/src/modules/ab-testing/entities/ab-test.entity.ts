import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('ab_tests')
export class ABTest {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  variantA!: string;

  @Column()
  variantB!: string;

  @Column('decimal', { precision: 3, scale: 2, default: 0.5 })
  allocation!: number;

  @CreateDateColumn()
  startDate!: Date;

  @Column({ nullable: true })
  endDate?: Date;
}
