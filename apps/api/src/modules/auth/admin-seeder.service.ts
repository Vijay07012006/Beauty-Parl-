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
    const adminEmail = 'vijaytechno28@gmail.com';
    const existing = await this.userRepo.findOne({ where: { email: adminEmail } });
    
    const seedPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!seedPassword) {
      throw new Error('Missing env var: ADMIN_SEED_PASSWORD');
    }

    if (!existing) {
      const hashedPassword = await bcrypt.hash(seedPassword, 10);
      const admin = this.userRepo.create({
        name: 'Vijay Kumar',
        email: adminEmail,
        password: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      });
      await this.userRepo.save(admin);
      console.log('✅ Admin user created:', adminEmail);
    } else {
      // Ensure existing user has admin role
      if (existing.role !== UserRole.SUPER_ADMIN) {
        existing.role = UserRole.SUPER_ADMIN;
        await this.userRepo.save(existing);
        console.log('✅ Existing user promoted to admin:', adminEmail);
      }
    }
  }
}
