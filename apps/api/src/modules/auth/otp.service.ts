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

  async generateAndStoreOtp(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    const key = `otp:${email}`;

    let redisSaved = false;
    if (this.redisService && this.redisService.isEnabled()) {
      try {
        await this.redisService.set(key, otp, 300);
        redisSaved = true;
      } catch (err) {
        console.warn('Redis OTP save failed, falling back to memory:', err);
      }
    }

    if (!redisSaved) {
      otpStore.set(email, { otp, expiresAt });
    }

    console.log('🔐 OTP generated for', email, ':', otp);
    return otp;
  }

  async sendOtpViaEmail(email: string, otp: string): Promise<void> {
    await this.emailService.sendOtpEmail(email, otp);
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const key = `otp:${email}`;
    let record: string | null = null;
    const fallbackRecord = otpStore.get(email);

    if (this.redisService && this.redisService.isEnabled()) {
      try {
        record = await this.redisService.get(key);
      } catch (err) {
        console.warn('Redis OTP retrieve failed, checking memory:', err);
      }
    }

    if (record) {
      if (record === otp) {
        try { await this.redisService?.del(key); } catch {}
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

  async resendOtp(email: string): Promise<string> {
    const otp = await this.generateAndStoreOtp(email);
    setImmediate(() => {
      this.emailService.sendOtpEmail(email, otp).catch(() => {});
    });
    return otp;
  }
}
