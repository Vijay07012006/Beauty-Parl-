import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('test')
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
