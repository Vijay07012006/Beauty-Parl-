import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { Request } from 'express';
import { AiChatService } from './ai-chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  // Auth required (EXT-3): user id is derived from the verified JWT, never from the
  // request body, so callers cannot impersonate another user's chat identity.
  @Post('send')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Req() req: Request,
    @Body() body: { message: string; sessionId?: string },
  ): Promise<{ reply: string; modelUsed: string }> {
    const { message, sessionId } = body;
    if (typeof message !== 'string' || !message.trim()) {
      throw new BadRequestException('message is required');
    }
    if (message.length > 500) {
      throw new BadRequestException('message is too long');
    }
    const userId = (req.user as { id?: number })?.id;
    return this.aiChatService.sendMessage(message, String(userId), sessionId);
  }
}
