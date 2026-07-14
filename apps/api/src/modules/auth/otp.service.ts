import { Injectable, Optional } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { RedisService } from '../redis/redis.service';

// In-memory OTP store fallback
// Key: email, Value: { otp, expiresAt }
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

@Injectable()
export class OtpService {
  constructor(
    private emailService: EmailService,
    @Optional() private redisService?: RedisService,
  ) {}

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOtp(email: string, phone?: string): Promise<string> {
    const otp = this.generateOtp();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    let redisSaved = false;
    if (this.redisService) {
      try {
        await this.redisService.set(`otp:${email}`, JSON.stringify({ otp, expiresAt }), 300);
        redisSaved = true;
      } catch (err) {
        console.warn('Redis OTP save failed, falling back to memory:', err);
      }
    }

    if (!redisSaved) {
      otpStore.set(email, { otp, expiresAt });
    }

    // Send real email
    await this.emailService.sendOtpEmail(email, otp);

    // Always visible in terminal
    console.log('\n================================================');
    console.log(`📧  OTP for ${email}: ${otp}`);
    if (phone) console.log(`📱  OTP for ${phone}: ${otp}`);
    console.log(`⏰  Expires in 5 minutes`);
    console.log('================================================\n');

    return otp;
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    let record: { otp: string; expiresAt: number } | null = null;

    if (this.redisService) {
      try {
        const val = await this.redisService.get(`otp:${email}`);
        if (val) {
          record = typeof val === 'string' ? JSON.parse(val) : val;
        }
      } catch (err) {
        console.warn('Redis OTP retrieve failed, checking memory:', err);
      }
    }

    if (!record) {
      record = otpStore.get(email) || null;
    }

    if (!record) {
      console.log(`[OTP] No OTP found for ${email}`);
      return false;
    }

    if (Date.now() > record.expiresAt) {
      console.log(`[OTP] OTP expired for ${email}`);
      if (this.redisService) {
        try { await this.redisService.del(`otp:${email}`); } catch {}
      }
      otpStore.delete(email);
      return false;
    }

    if (record.otp !== otp) {
      console.log(`[OTP] Invalid OTP for ${email}: expected ${record.otp}, got ${otp}`);
      return false;
    }

    console.log(`[OTP] ✅ OTP verified successfully for ${email}`);
    if (this.redisService) {
      try { await this.redisService.del(`otp:${email}`); } catch {}
    }
    otpStore.delete(email);
    return true;
  }
}

