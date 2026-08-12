import { Injectable, Optional, BadRequestException, ForbiddenException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';

const otpStore = new Map<string, { otpHash: string; expiresAt: number }>();
const resendCooldown = new Map<string, number>(); // email -> last sent timestamp (ms)
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

const MAX_VERIFY_ATTEMPTS = 5; // per OTP
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes after exhausting attempts

// In-memory fallback for verify-attempt counters (Redis is preferred)
const verifyAttempts = new Map<string, { count: number; lockedUntil: number }>();

@Injectable()
export class OtpService {
  constructor(
    private emailService: EmailService,
    @Optional() private redisService?: RedisService,
  ) {}

  // Store only a SHA-256 hash of the OTP — a store/Redis compromise exposes no live OTPs (C-2)
  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(`otp:${otp}`).digest('hex');
  }

  private async isLockedOut(email: string): Promise<boolean> {
    const lockKey = `otp:lock:${email}`;
    if (this.redisService && this.redisService.isEnabled()) {
      try {
        const locked = await this.redisService.get(lockKey);
        return locked === '1';
      } catch {}
    }
    const entry = verifyAttempts.get(email);
    return !!entry && entry.lockedUntil > Date.now();
  }

  private async recordFailedAttempt(email: string): Promise<boolean> {
    // Returns true once the account is locked out
    const countKey = `otp:attempts:${email}`;
    if (this.redisService && this.redisService.isEnabled()) {
      try {
        const cur = await this.redisService.get(countKey);
        const next = (cur ? Number(cur) : 0) + 1;
        if (next >= MAX_VERIFY_ATTEMPTS) {
          await this.redisService.set(`otp:lock:${email}`, '1', Math.floor(LOCKOUT_MS / 1000));
          await this.redisService.del(countKey);
          return true;
        }
        await this.redisService.set(countKey, String(next), Math.floor(LOCKOUT_MS / 1000));
        return false;
      } catch {
        // fall through to in-memory
      }
    }
    const entry = verifyAttempts.get(email) || { count: 0, lockedUntil: 0 };
    entry.count += 1;
    if (entry.count >= MAX_VERIFY_ATTEMPTS) {
      entry.lockedUntil = Date.now() + LOCKOUT_MS;
      entry.count = 0;
      verifyAttempts.set(email, entry);
      return true;
    }
    verifyAttempts.set(email, entry);
    return false;
  }

  private clearAttempts(email: string): void {
    if (this.redisService && this.redisService.isEnabled()) {
      try {
        this.redisService.del(`otp:attempts:${email}`).catch(() => {});
        this.redisService.del(`otp:lock:${email}`).catch(() => {});
      } catch {}
    }
    verifyAttempts.delete(email);
  }

  async generateAndStoreOtp(email: string): Promise<string> {
    // Cryptographically secure OTP — NOT Math.random()
    const otp = String(crypto.randomInt(100000, 1000000)); // 6 digits
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    const key = `otp:${email}`;
    const otpHash = this.hashOtp(otp);

    let redisSaved = false;
    if (this.redisService && this.redisService.isEnabled()) {
      try {
        await this.redisService.set(key, otpHash, 300);
        redisSaved = true;
      } catch (err) {
        console.warn('Redis OTP save failed, falling back to memory:', err);
      }
    }

    if (!redisSaved) {
      otpStore.set(email, { otpHash, expiresAt });
    }

    return otp;
  }

  async sendOtpViaEmail(email: string, otp: string): Promise<void> {
    await this.emailService.sendOtpEmail(email, otp);
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const normalizedEmail = email.trim().toLowerCase();
    if (await this.isLockedOut(normalizedEmail)) {
      throw new ForbiddenException('Too many attempts. Please try again later.');
    }

    const key = `otp:${normalizedEmail}`;
    let record: string | null = null;
    const fallbackRecord = otpStore.get(normalizedEmail);

    if (this.redisService && this.redisService.isEnabled()) {
      try {
        record = await this.redisService.get(key);
      } catch (err) {
        console.warn('Redis OTP retrieve failed, checking memory:', err);
      }
    }

    if (record) {
      const ok = crypto.timingSafeEqual(Buffer.from(record, 'utf8'), Buffer.from(this.hashOtp(otp), 'utf8'));
      if (ok) {
        try { await this.redisService?.del(key); } catch {}
        this.clearAttempts(normalizedEmail);
        return true;
      }
      return this.handleFailure(normalizedEmail);
    }

    if (fallbackRecord) {
      if (Date.now() > fallbackRecord.expiresAt) {
        otpStore.delete(normalizedEmail);
        return false;
      }
      const ok = crypto.timingSafeEqual(
        Buffer.from(fallbackRecord.otpHash, 'utf8'),
        Buffer.from(this.hashOtp(otp), 'utf8'),
      );
      if (ok) {
        otpStore.delete(normalizedEmail);
        this.clearAttempts(normalizedEmail);
        return true;
      }
      return this.handleFailure(normalizedEmail);
    }

    return false;
  }

  private async handleFailure(email: string): Promise<boolean> {
    const locked = await this.recordFailedAttempt(email);
    if (locked) {
      throw new ForbiddenException('Too many attempts. Please try again later.');
    }
    return false;
  }

  async resendOtp(email: string): Promise<string> {
    const normalizedEmail = email.trim().toLowerCase();
    const lastSent = resendCooldown.get(normalizedEmail) || 0;
    if (Date.now() - lastSent < RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - lastSent)) / 1000);
      throw new BadRequestException(`Please wait ${waitSeconds}s before requesting another OTP`);
    }
    resendCooldown.set(normalizedEmail, Date.now());
    const otp = await this.generateAndStoreOtp(normalizedEmail);
    setImmediate(() => {
      this.emailService.sendOtpEmail(normalizedEmail, otp).catch(() => {});
    });
    return otp;
  }
}
