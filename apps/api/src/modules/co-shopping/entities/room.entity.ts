import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('co_shopping_rooms')
export class Room {
  @PrimaryColumn()
  id!: string;

  @Column()
  hostId!: number;

  @Column('simple-json')
  participants!: Array<{ userId: number; name: string; socketId: string }>;

  @Column('simple-json')
  sharedCartItems!: Array<{ productId: number; name: string; price: number; quantity: number; image?: string; addedByUserId: number }>;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ default: true })
  isActive!: boolean;
}
