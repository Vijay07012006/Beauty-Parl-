import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('waitlist')
@UseGuards(JwtAuthGuard)
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post(':productId')
  async joinWaitlist(@Request() req: any, @Param('productId') productId: string) {
    const userId = Number(req.user.id);
    return this.waitlistService.joinWaitlist(userId, Number(productId));
  }

  @Get(':productId')
  async checkStatus(@Request() req: any, @Param('productId') productId: string) {
    const userId = Number(req.user.id);
    return this.waitlistService.checkStatus(userId, Number(productId));
  }
}
