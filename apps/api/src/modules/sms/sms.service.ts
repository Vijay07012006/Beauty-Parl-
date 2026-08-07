import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';

@Injectable()
export class SmsService {
  private client: twilio.Twilio | null = null;

  constructor(private config: ConfigService) {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID') || process.env.TWILIO_ACCOUNT_SID;
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN') || process.env.TWILIO_AUTH_TOKEN;
    if (accountSid && authToken) {
      try {
        this.client = twilio(accountSid, authToken);
      } catch (err) {
        console.error('Failed to initialize Twilio client:', err);
      }
    } else {
      console.warn('⚠️ TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are not set. SMS service is operating in log-only fallback mode.');
    }
  }

  async sendOtpSms(to: string, otp: string): Promise<void> {
    const fromNumber = this.config.get<string>('TWILIO_PHONE_NUMBER') || process.env.TWILIO_PHONE_NUMBER || '+1234567890';
    if (this.client) {
      try {
        await this.client.messages.create({
          body: `Your Beauty Parlé OTP is: ${otp}. Valid for 5 minutes.`,
          to: to,
          from: fromNumber,
        });
        console.log(`✅ OTP SMS sent successfully to ${to}`);
        return;
      } catch (err: any) {
        console.error(`❌ Twilio send SMS failed for ${to}:`, err.message);
      }
    }
    console.log(`\n================================================`);
    console.log(`📱 SMS OTP for ${to}:`);
    console.log(`🔐 OTP Code: ${otp}`);
    console.log(`================================================\n`);
  }
}
