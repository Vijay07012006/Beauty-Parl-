import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
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
    private config: ConfigService,
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
    try {
      // ✅ Find user
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        // ✅ Security: Don't reveal if user exists
        console.log(`🔍 Forgot password attempt for: ${email} (not found)`);
        return { success: true, message: 'If this email exists, a reset link has been sent' };
      }

      // ✅ Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      await this.userRepository.update(user.id, { resetToken, resetTokenExpiry: expiry });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetLink = `${frontendUrl}/en/auth/reset-password/${resetToken}`;

      // ✅ ALWAYS PRINT RESET LINK IN CONSOLE (Fallback for email failures)
      console.log(`🔗 RESET LINK: ${resetLink}`);
      console.log(`📧 Email: ${email}`);

      // ✅ Try sending email (non-blocking)
      try {
        await this.emailService.sendPasswordResetEmail(email, resetToken);
        console.log(`✅ Email sent to ${email}`);
      } catch (emailError: any) {
        console.log(`⚠️ Email failed: ${emailError.message}`);
        console.log(`🔗 Use this link: ${resetLink}`);
      }

      return { success: true, message: 'If this email exists, a reset link has been sent' };
    } catch (error: any) {
      console.error('❌ Forgot password error:', error.message);
      // ✅ Always return success (security)
      return { success: true, message: 'If this email exists, a reset link has been sent' };
    }
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

  async getPreferences(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    return user.emailPreferences || {
      marketing: true,
      order_updates: true,
      newsletter: false,
      promotional: false,
    };
  }

  async updatePreferences(userId: number, preferences: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const emailPreferences = {
      marketing: !!preferences.marketing,
      order_updates: !!preferences.order_updates,
      newsletter: !!preferences.newsletter,
      promotional: !!preferences.promotional,
    };

    await this.userRepository.update(userId, { emailPreferences });
    return emailPreferences;
  }

  async validateOAuthUser(profile: any, provider: 'google' | 'facebook') {
    if (provider === 'google' && !process.env.GOOGLE_CLIENT_ID && !this.config.get('GOOGLE_CLIENT_ID')) {
      throw new InternalServerErrorException('GOOGLE_CLIENT_ID environment variable is missing on the server.');
    }
    if (provider === 'facebook' && !process.env.FACEBOOK_APP_ID && !this.config.get('FACEBOOK_APP_ID')) {
      throw new InternalServerErrorException('FACEBOOK_APP_ID environment variable is missing on the server.');
    }

    const { email, name, avatar, googleId, facebookId } = profile;

    // Check if user exists
    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Create new user
      const hashedPassword = await bcrypt.hash('oauth_temp_' + Date.now(), 10);
      user = this.userRepository.create({
        email,
        name,
        password: hashedPassword,
        avatar,
        isVerified: true,
        isSocialLogin: true,
      });
      if (provider === 'google') user.googleId = googleId;
      if (provider === 'facebook') user.facebookId = facebookId;
      await this.userRepository.save(user);
    } else {
      // Update social credentials if linking existing account
      let updated = false;
      if (provider === 'google' && !user.googleId) {
        user.googleId = googleId;
        user.isSocialLogin = true;
        updated = true;
      }
      if (provider === 'facebook' && !user.facebookId) {
        user.facebookId = facebookId;
        user.isSocialLogin = true;
        updated = true;
      }
      if (avatar && !user.avatar) {
        user.avatar = avatar;
        updated = true;
      }
      if (updated) {
        await this.userRepository.save(user);
      }
    }

    // Generate JWT
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    };
  }
}
