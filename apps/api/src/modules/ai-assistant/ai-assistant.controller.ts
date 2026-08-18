import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
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
    @Res() res: Response,
  ) {
    try {
      const sessionId = body.sessionId || `sess_${Date.now()}`;
      const response = await this.aiService.processMessage(
        req.user,
        sessionId,
        body.message,
      );
      return res.json(response);
    } catch (error: any) {
      console.error('JARVIS Error:', error);
      return res.status(500).json({
        error:
          'JARVIS encountered an error while processing your request. Please try again.',
      });
    }
  }

  @Get('history')
  async history(@Request() req: any) {
    const userId = req.user.id;
    return this.aiService.getUserHistory(userId);
  }

  @Post('train-ticket')
  async trainTicket(@Body() body: { ticketId: number; aiSummary: string }) {
    return this.aiService.trainFromTicket(body.ticketId, body.aiSummary);
  }
}
