import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  phone!: string;

  @Column({ default: false })
  isVerified!: boolean;

  @Column({ default: 'email' })
  otpChannel!: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: {
      marketing: true,
      order_updates: true,
      newsletter: false,
      promotional: false,
    },
  })
  emailPreferences!: {
    marketing: boolean;
    order_updates: boolean;
    newsletter: boolean;
    promotional: boolean;
  };

  @Column({ nullable: true })
  resetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetTokenExpiry?: Date;

  @Column({ nullable: true })
  googleId?: string;

  @Column({ nullable: true })
  facebookId?: string;

  @Column({ nullable: true })
  avatar?: string;

  @Column({ default: false })
  isSocialLogin!: boolean;

  @Column({ type: 'integer', default: 0 })
  loyaltyPoints!: number;

  @Column({ type: 'varchar', length: 20, default: 'silver' })
  loyaltyTier!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalSpent!: number;

  @Column({ type: 'date', nullable: true })
  birthday?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
