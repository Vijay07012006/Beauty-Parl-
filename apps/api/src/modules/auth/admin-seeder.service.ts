import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    try {
      const adminEmail = 'vijaytechno28@gmail.com';
      const existing = await this.userRepo.findOne({
        where: { email: adminEmail },
      });

      const seedPassword = process.env.ADMIN_SEED_PASSWORD;
      if (!seedPassword) {
        console.warn(
          '⚠️ [AdminSeeder] Missing env var: ADMIN_SEED_PASSWORD. Skipping admin seeding.',
        );
        return;
      }

      // H-1 (account-takeover): NEVER escalate an account that already exists — an
      // attacker who registered this email via the public signup would otherwise be
      // silently promoted to SUPER_ADMIN with a password they control.
      if (existing) {
        if (existing.role === UserRole.SUPER_ADMIN && existing.isVerified) {
          console.log(
            'ℹ️ [AdminSeeder] Admin account already present and verified. No changes made.',
          );
          return;
        }
        console.error(
          `❌ [AdminSeeder] Refusing to seed: account ${adminEmail} already exists but is not a verified SUPER_ADMIN. ` +
            'Manually fix this account; automated promotion is disabled to prevent account takeover.',
        );
        return;
      }

      if (seedPassword.length < 10) {
        console.error(
          '❌ [AdminSeeder] ADMIN_SEED_PASSWORD is too weak. Refusing to create a super admin with a weak password.',
        );
        return;
      }

      const hashedPassword = await bcrypt.hash(seedPassword, 10);
      const admin = this.userRepo.create({
        name: 'Vijay Kumar',
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        isVerified: true,
      });
      await this.userRepo.save(admin);
      console.log('✅ Admin user created:', adminEmail);
    } catch (error: any) {
      console.error(
        '❌ [AdminSeeder] Admin seeding failed gracefully:',
        error.message,
      );
    }
  }
}
