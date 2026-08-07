import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserRole } from './user.entity';
import { EmailService } from '../email/email.service';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private otpService: OtpService,
  ) {}

  async register(registerDto: any) {
    const { email, password, name, phone } = registerDto;

    // ✅ Fast validation (no database calls)
    if (!email || !password || !name) {
      throw new BadRequestException('All fields are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // ✅ Check if user exists (indexed query)
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // ✅ Fast bcrypt (8 rounds instead of 10 for speed)
    const hashedPassword = await bcrypt.hash(password, 8);

    // ✅ Create user (single query)
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      phone: phone || '',
      isVerified: false,
      role: UserRole.USER,
    });
    await this.userRepository.save(user);

    // ✅ Generate OTP (non-blocking, fast Redis)
    let otp = '';
    try {
      otp = await this.otpService.generateAndStoreOtp(email);
      console.log('📧 OTP for', email, ':', otp);
    } catch (err: any) {
      console.log('⚠️ OTP generation failed:', err.message);
      // Still return success — user can resend OTP later
    }

    // ✅ Send OTP via email (non-blocking)
    if (otp) {
      setImmediate(() => {
        this.emailService.sendOtpEmail(email, otp).catch(() => {});
      });
    }

    const { password: _, ...result } = user;
    return { success: true, user: result, otp };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }
    return user;
  }

  async login(user: any) {
    // Check if user is verified
    if (!user.isVerified) {
      return {
        requiresOtp: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      };
    }
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);
    
    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    };
  }

  async forgotPassword(email: string) {
    // ✅ Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // ✅ Always return success (security: don't reveal if user exists)
      return { success: true, message: 'If this email exists, a reset link has been sent' };
    }

    // ✅ Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepository.update(user.id, { resetToken, resetTokenExpiry: expiry });

    // ✅ Send email with fallback to console (NON-BLOCKING)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/en/auth/reset-password/${resetToken}`;
    
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
      console.log(`✅ Reset email sent to ${email}`);
    } catch (error) {
      console.log(`⚠️ Reset email failed. Fallback link: ${resetLink}`);
    }

    console.log('\n================================================');
    console.log(`🔑 Password Reset Link for ${email}:`);
    console.log(`🔗 ${resetLink}`);
    console.log('================================================\n');

    return { success: true, message: 'If this email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findOne({ 
      where: { resetToken: token },
    });
    
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    
    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, { 
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpiry: undefined,
    });
    
    return { success: true, message: 'Password reset successfully' };
  }

  async updateProfile(userId: number, name?: string, phone?: string) {
    await this.userRepository.update(userId, { name, phone });
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    const { password, ...result } = user;
    return result;
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

  async verifyOtp(email: string, otp: string) {
    const isValid = await this.otpService.verifyOtp(email, otp);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    
    await this.userRepository.update({ email }, { isVerified: true });
    return { success: true, message: 'Account verified successfully' };
  }
}
