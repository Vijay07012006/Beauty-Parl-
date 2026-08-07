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
    const user = await this.userRepo.findOne({ where: { email: body.email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    await this.otpService.sendOtp(body.email, body.phone);
    return { success: true, message: 'OTP sent successfully' };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    const isValid = await this.otpService.verifyOtp(body.email, body.otp);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    await this.userRepo.update({ email: body.email }, { isVerified: true });
    return { success: true, message: 'Account verified successfully' };
  }

  @Post('resend-otp')
  async resendOtp(@Body() body: { email: string; phone: string }) {
    const user = await this.userRepo.findOne({ where: { email: body.email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    await this.otpService.resendOtp(body.email, body.phone);
    return { success: true, message: 'OTP resent successfully' };
  }
}
