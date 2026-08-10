import { Controller, Get, Post, Param, Body, Headers, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { QuizzesService } from './quizzes.service';

@Controller('quizzes')
export class QuizzesController {
  constructor(
    private readonly quizzesService: QuizzesService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserOrSession(authHeader?: string, sessionHeader?: string) {
    let userId: number | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token);
        if (payload?.sub) userId = Number(payload.sub);
      } catch {}
    }
    return { userId, sessionId: sessionHeader };
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
  async submit(
    @Param('id') id: string,
    @Body() body: { answers: Record<string, string> },
    @Headers('authorization') authHeader?: string,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.extractUserOrSession(authHeader, sessionHeader);
    return this.quizzesService.submitAnswers(id, body.answers, userId, sessionId);
  }
}
