import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('subscribe')
  async subscribe(@Body() body: { url: string; events: string[] }) {
    return this.webhooksService.subscribe(body.url, body.events);
  }

  @Get('subscriptions')
  async getSubscriptions() {
    return this.webhooksService.listSubscriptions();
  }

  @Get('attempts')
  async getAttempts() {
    return this.webhooksService.listAttempts();
  }

  @Post('unsubscribe/:id')
  async unsubscribe(@Param('id') id: string) {
    await this.webhooksService.unsubscribe(Number(id));
    return { success: true };
  }
}
