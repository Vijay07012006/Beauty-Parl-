import { Injectable, Optional } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';

const otpStore = new Map<string, { otp: string; expiresAt: number }>();

@Injectable()
export class OtpService {
  constructor(
    private emailService: EmailService,
    @Optional() private redisService?: RedisService,
  ) {}

  async sendOtp(email: string, phone?: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    let redisSaved = false;
    if (this.redisService && this.redisService.isEnabled()) {
      try {
        await this.redisService.set(`otp:${email}`, otp, 300);
        redisSaved = true;
      } catch (err) {
        console.warn('Redis OTP save failed, falling back to memory:', err);
      }
    }

    if (!redisSaved) {
      otpStore.set(email, { otp, expiresAt });
    }

    // Try email
    try {
      await this.emailService.sendOtpEmail(email, otp);
      console.log(`✅ OTP email sent to ${email}`);
    } catch (error: any) {
      console.log(`⚠️ OTP email failed. Fallback to console.`);
      console.log(`📧 OTP for ${email}: ${otp}`);
    }
    
    // Always print to console as backup
    console.log(`🔐 OTP for ${email}: ${otp}`);
    return otp;
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    let record: string | null = null;
    const fallbackRecord = otpStore.get(email);

    if (this.redisService && this.redisService.isEnabled()) {
      try {
        record = await this.redisService.get(`otp:${email}`);
      } catch (err) {
        console.warn('Redis OTP retrieve failed, checking memory:', err);
      }
    }

    if (record) {
      if (record === otp) {
        try { await this.redisService?.del(`otp:${email}`); } catch {}
        return true;
      }
      return false;
    }

    if (fallbackRecord) {
      if (Date.now() > fallbackRecord.expiresAt) {
        otpStore.delete(email);
        return false;
      }
      if (fallbackRecord.otp === otp) {
        otpStore.delete(email);
        return true;
      }
      return false;
    }

    return false;
  }

  async resendOtp(email: string, phone?: string): Promise<string> {
    return this.sendOtp(email, phone);
  }
}
