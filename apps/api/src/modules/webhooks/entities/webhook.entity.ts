import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('webhook_subscriptions')
export class WebhookSubscription {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  url!: string;

  @Column('simple-array')
  events!: string[];

  @Column()
  signingSecret!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('webhook_attempts')
export class WebhookAttempt {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  subscriptionId!: number;

  @Column()
  event!: string;

  @Column()
  responseStatus!: number;

  @Column({ type: 'text', nullable: true })
  responseBody?: string;

  @Column()
  success!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
