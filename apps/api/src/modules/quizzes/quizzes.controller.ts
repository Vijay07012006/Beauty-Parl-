import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Headers,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { QuizzesService } from './quizzes.service';
import { OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzesService: QuizzesService) {}

  private userOrSession(req: Request, sessionHeader?: string) {
    const user = req.user;
    return { userId: user?.id, sessionId: sessionHeader };
  }

  @Get()
  getQuizzes() {
    return this.quizzesService.getQuizzes();
  }

  @Get(':id/questions')
  getQuestions(@Param('id') id: string) {
    const questions = this.quizzesService.getQuizQuestions(id);
    if (!questions) throw new NotFoundException('Quiz not found');
    return questions;
  }

  @Post(':id/submit')
  @UseGuards(OptionalJwtAuthGuard)
  async submit(
    @Param('id') id: string,
    @Body() body: { answers: Record<string, string> },
    @Req() req: Request,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.userOrSession(req, sessionHeader);
    return this.quizzesService.submitAnswers(
      id,
      body.answers,
      userId,
      sessionId,
    );
  }
}
