import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserRole } from './user.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
      if (!user.isActive) {
        throw new UnauthorizedException('Account is inactive.');
      }
      const { password: _, ...result } = user;
      return result;
    }
    return null;
  }

  async register(registerDto: any) {
    const { email, password, name, phone } = registerDto;
    
    // Check if user exists
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Save user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      phone,
      role: UserRole.USER,
      isActive: true, // Let account stay active, use isVerified flag instead
      isVerified: false, // OTP is required to verify
    });
    await this.userRepository.save(user);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);

    // Return user without password
    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    if (!user.isVerified) {
      return { requiresOtp: true, email: user.email };
    }
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect.');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
    return { success: true, message: 'Password changed successfully' };
  }

  async activateUser(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user) {
      user.isVerified = true;
      await this.userRepository.save(user);
    }
  }

  async forgotPassword(email: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User with this email does not exist.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry
    await this.userRepository.save(user);

    // Send real password reset email
    await this.emailService.sendPasswordResetEmail(user.email, token);

    const resetLink = `http://localhost:3000/en/auth/reset-password/${token}`;
    console.log('\n================================================');
    console.log(`🔑 Password Reset Link for ${email}:`);
    console.log(`🔗 ${resetLink}`);
    console.log('================================================\n');

    return token;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { resetToken: token } 
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    if (user.resetTokenExpiry && Date.now() > user.resetTokenExpiry.getTime()) {
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await this.userRepository.save(user);
      throw new BadRequestException('Reset token has expired.');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await this.userRepository.save(user);
  }
}
