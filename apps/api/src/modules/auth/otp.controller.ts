import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OtpService } from './otp.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Controller('auth')
export class OtpController {
  constructor(
    private otpService: OtpService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  @Post('verify-otp')
  @Throttle({ default: { limit: 3, ttl: 900000 } }) // 3 attempts per 15 minutes
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    const isValid = await this.otpService.verifyOtp(body.email, body.otp);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    await this.userRepo.update({ email: body.email }, { isVerified: true });
    return { success: true, message: 'Account verified successfully' };
  }

  @Post('resend-otp')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // Max 3 resends per 60s
  async resendOtp(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    const user = await this.userRepo.findOne({ where: { email: body.email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const otp = await this.otpService.resendOtp(body.email);
    setImmediate(() => {
      this.otpService.sendOtpViaEmail(body.email, otp).catch(() => {});
    });
    return { success: true, message: 'OTP resent successfully' };
  }
}
