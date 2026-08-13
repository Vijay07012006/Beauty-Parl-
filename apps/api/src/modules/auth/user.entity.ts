import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { Role } from '../roles/role.entity';
import { EncryptionTransformer } from '../security/encryption.transformer';
import { JsonEncryptionTransformer } from '../security/json-encryption.transformer';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/**
 * Removes sensitive/internal fields before sending a user entity to the client.
 */
export function sanitizeUser(user: any): any {
  if (!user || typeof user !== 'object') return user;
  const {
    password,
    resetToken,
    resetTokenExpiry,
    twoFactorSecret,
    twoFactorBackupCodes,
    ...safe
  } = user;
  return safe;
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

  @Column({ type: 'timestamp', nullable: true })
  suspendedUntil?: Date;

  @Column({ nullable: true })
  suspensionReason?: string;

  @ManyToMany(() => Role)
  @JoinTable({ name: 'user_roles' })
  roles!: Role[];

  @Column({ nullable: true, transformer: new EncryptionTransformer() })
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

  @Column({ name: 'is_two_factor_enabled', default: false })
  isTwoFactorEnabled!: boolean;

  @Column({ name: 'two_factor_secret', nullable: true, transformer: new EncryptionTransformer() })
  twoFactorSecret?: string;

  @Column({ name: 'two_factor_backup_codes', type: 'jsonb', nullable: true, transformer: new JsonEncryptionTransformer() })
  twoFactorBackupCodes?: string[];

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
