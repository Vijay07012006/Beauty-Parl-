import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  // Admin-only — prevents unauthenticated use of the SMTP relay (EMAIL-1)
  @Post('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async testEmail(@Body() body: { to: string }) {
    try {
      await this.emailService.sendTestEmail(body.to);
      return { success: true, message: `Test email sent to ${body.to}!` };
    } catch (error: any) {
      console.error('❌ Test email failed:', error.message);
      return { success: false, error: error.message };
    }
  }
}
