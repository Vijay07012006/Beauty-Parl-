import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { generateSecret, generateURI, verifySync } from 'otplib';
import * as QRCode from 'qrcode';
import { User, UserRole, sanitizeUser } from './user.entity';
import { UserSession } from './user-session.entity';
import { EmailService } from '../email/email.service';
import { OtpService } from './otp.service';
import { ReferralsService } from '../referrals/referrals.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private otpService: OtpService,
    private config: ConfigService,
    private referralsService: ReferralsService,
    private auditLogsService: AuditLogsService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex').substring(0, 64);
  }

  private async createUserSession(
    userId: number,
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const tokenHash = this.hashToken(token);
    const session = this.userSessionRepository.create({
      userId,
      tokenHash,
      ipAddress,
      userAgent,
    });
    await this.userSessionRepository.save(session);
  }

  async getUserSessions(userId: number) {
    return this.userSessionRepository.find({
      where: { userId },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        lastActivityAt: true,
        createdAt: true,
      },
      order: { lastActivityAt: 'DESC' },
    });
  }

  async revokeSession(userId: number, sessionId: number): Promise<void> {
    const session = await this.userSessionRepository.findOne({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to revoke this session');
    }
    await this.userSessionRepository.delete(sessionId);
  }

  async revokeAllSessions(userId: number): Promise<void> {
    await this.userSessionRepository.delete({ userId });
  }

  async register(registerDto: any) {
    const { email, password, name, phone, referralCode } = registerDto;

    // âœ… Fast validation (no database calls)
    if (!email || !password || !name) {
      throw new BadRequestException('All fields are required');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    // âœ… Check if user exists (indexed query)
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new BadRequestException('Email already registered');
    }

    // âœ… Fast bcrypt (8 rounds instead of 10 for speed)
    const hashedPassword = await bcrypt.hash(password, 8);

    // âœ… Create user (single query)
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      name,
      phone: phone || '',
      isVerified: false,
      role: UserRole.USER,
    });
    await this.userRepository.save(user);

    // Apply and process referral if exists
    if (referralCode) {
      try {
        await this.referralsService.applyReferralCode(referralCode, email);
        await this.referralsService.processReferralJoin(email, user.id);
      } catch (err: any) {
        console.error('Failed to apply referral code during register:', err.message);
      }
    }

    // âœ… Generate OTP (non-blocking, fast Redis)
    let otp = '';
    try {
      otp = await this.otpService.generateAndStoreOtp(email);
    } catch (err: any) {
      console.log('âš ï¸ OTP generation failed:', err.message);
      // Still return success â€” user can resend OTP later
    }

    // âœ… Send OTP via email (non-blocking)
    if (otp) {
      setImmediate(() => {
        this.emailService.sendOtpEmail(email, otp).catch(() => {});
      });
    }

    const result = sanitizeUser(user);
    await this.auditLogsService.log('USER_REGISTERED', email, user.id);
    return { success: true, user: result };
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

  async login(user: any, metadata?: { ipAddress?: string; userAgent?: string }) {
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

    if (user.isTwoFactorEnabled) {
      return {
        requiresTwoFactor: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      };
    }
    
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    await this.createUserSession(
      user.id,
      token,
      metadata?.ipAddress,
      metadata?.userAgent,
    );

    await this.auditLogsService.log('USER_LOGIN', user.email, user.id);
    
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
      // âœ… Find user
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        // âœ… Security: Don't reveal if user exists
        console.log(`ðŸ” Forgot password attempt for: ${email} (not found)`);
        await this.auditLogsService.log('FORGOT_PASSWORD_ATTEMPT_INVALID', email);
        return { success: true, message: 'If this email exists, a reset link has been sent' };
      }

      await this.auditLogsService.log('FORGOT_PASSWORD_REQUESTED', email, user.id);

      // âœ… Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiry = new Date(Date.now() + 3600000); // 1 hour

      await this.userRepository.update(user.id, { resetToken, resetTokenExpiry: expiry });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetLink = `${frontendUrl}/en/auth/reset-password/${resetToken}`;

      // Try sending email (non-blocking)
      try {
        await this.emailService.sendPasswordResetEmail(email, resetToken);
        console.log(`âœ… Password reset email sent to ${email}`);
      } catch (emailError: any) {
        console.log(`âš ï¸ Password reset email failed for ${email}: ${emailError.message}`);
      }

      return { success: true, message: 'If this email exists, a reset link has been sent' };
    } catch (error: any) {
      console.error('âŒ Forgot password error:', error.message);
      // âœ… Always return success (security)
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

    await this.auditLogsService.log('PASSWORD_RESET', user.email, user.id);
    
    return { success: true, message: 'Password reset successfully' };
  }

  async updateProfile(userId: number, name?: string, phone?: string, birthday?: Date) {
    const updateData: any = { name, phone };
    if (birthday !== undefined) {
      updateData.birthday = birthday;
    }
    await this.userRepository.update(userId, updateData);
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    return sanitizeUser(user);
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
    await this.auditLogsService.log('PASSWORD_CHANGED', user.email, user.id);
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

  async validateOAuthUser(
    profile: any,
    provider: 'google' | 'facebook',
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
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
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    await this.createUserSession(
      user.id,
      token,
      metadata?.ipAddress,
      metadata?.userAgent,
    );

    return {
      access_token: token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
    };
  }

  async resendOtp(email: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    await this.otpService.resendOtp(email);
    await this.auditLogsService.log('USER_OTP_RESENT', email, user.id);
  }

  private generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < count; i++) {
      let code = '';
      for (let j = 0; j < 8; j++) {
        code += chars.charAt(crypto.randomInt(0, chars.length));
      }
      codes.push(code);
    }
    return codes;
  }

  async generateTwoFactorSecret(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const secret = generateSecret();
    const appName = process.env.APP_NAME || 'Beauty Parle';
    const otpAuthUrl = generateURI({ strategy: 'totp', issuer: appName, label: user.email, secret });
    const qrCode = await QRCode.toDataURL(otpAuthUrl);
    const backupCodes = this.generateBackupCodes();

    await this.auditLogsService.log('TWO_FACTOR_GENERATED', user.email, user.id);

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  async verifyAndEnableTwoFactor(
    userId: number,
    token: string,
    secret: string,
    backupCodes: string[],
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    if (user.isTwoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const isValid = verifySync({ token, secret }).valid;
    if (!isValid) {
      throw new BadRequestException('Invalid 2FA token');
    }

    user.twoFactorSecret = secret;
    user.twoFactorBackupCodes = backupCodes;
    user.isTwoFactorEnabled = true;
    await this.userRepository.save(user);

    await this.auditLogsService.log('TWO_FACTOR_ENABLED', user.email, user.id);

    return { success: true, message: '2FA enabled successfully' };
  }

  async disableTwoFactor(userId: number, password: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Incorrect password');
    }

    user.isTwoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorBackupCodes = undefined;
    await this.userRepository.save(user);

    await this.auditLogsService.log('TWO_FACTOR_DISABLED', user.email, user.id);

    return { success: true, message: '2FA disabled successfully' };
  }

  async verifyTwoFactorLogin(
    email: string,
    token: string,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    if (!user.isTwoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled for this user');
    }

    let verified = false;
    let usedBackupCode = false;

    if (user.twoFactorSecret) {
      try {
        verified = verifySync({ token, secret: user.twoFactorSecret }).valid;
      } catch {
        verified = false;
      }
    }

    if (!verified && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
      const tokenUpper = token.toUpperCase();
      const backupIndex = user.twoFactorBackupCodes.findIndex(
        (code) => code.toUpperCase() === tokenUpper,
      );
      if (backupIndex !== -1) {
        verified = true;
        usedBackupCode = true;
        user.twoFactorBackupCodes.splice(backupIndex, 1);
        await this.userRepository.save(user);
      }
    }

    if (!verified) {
      await this.auditLogsService.log('TWO_FACTOR_LOGIN_FAILED', email, user.id);
      throw new BadRequestException('Invalid 2FA token or backup code');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    await this.createUserSession(
      user.id,
      accessToken,
      metadata?.ipAddress,
      metadata?.userAgent,
    );

    await this.auditLogsService.log('USER_LOGIN', user.email, user.id, {
      twoFactor: true,
      backupCodeUsed: usedBackupCode,
    });

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
