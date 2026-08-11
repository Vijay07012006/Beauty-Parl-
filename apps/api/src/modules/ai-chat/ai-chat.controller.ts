import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AiChatService } from './ai-chat.service';

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() body: { message: string; userId?: string; sessionId?: string },
  ): Promise<{ reply: string; modelUsed: string }> {
    const { message, userId, sessionId } = body;
    return this.aiChatService.sendMessage(message, userId, sessionId);
  }
}
