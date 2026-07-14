import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
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

  @Post('send-otp')
  async sendOtp(@Body() body: { email: string; phone: string }) {
    await this.otpService.sendOtp(body.email, body.phone);
    return { success: true, message: 'OTP sent' };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    const isValid = await this.otpService.verifyOtp(body.email, body.otp);
    if (!isValid) {
      return { success: false, message: 'Invalid OTP' };
    }
    // Mark user as verified
    await this.userRepo.update({ email: body.email }, { isVerified: true });
    return { success: true, message: 'Verified successfully' };
  }
}
