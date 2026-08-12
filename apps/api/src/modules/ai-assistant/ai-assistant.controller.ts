import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiAssistantService } from './ai-assistant.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiAssistantController {
  constructor(private aiService: AiAssistantService) {}

  @Post('chat')
  async chat(
    @Request() req: any,
    @Body() body: { message: string; sessionId?: string },
  ) {
    const userId = req.user.id;
    const sessionId = body.sessionId || `sess_${Date.now()}`;
    return this.aiService.processMessage(userId, sessionId, body.message);
  }

  @Get('history')
  async history(@Request() req: any) {
    const userId = req.user.id;
    return this.aiService.getUserHistory(userId);
  }
}
