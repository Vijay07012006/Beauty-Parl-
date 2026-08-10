import { Controller, Get, Post, Delete, Param, Headers } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ComparisonService } from './comparison.service';

@Controller('comparison')
export class ComparisonController {
  constructor(
    private readonly comparisonService: ComparisonService,
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

  @Post('add/:productId')
  async add(
    @Param('productId') productId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.extractUserOrSession(authHeader, sessionHeader);
    return this.comparisonService.add(Number(productId), userId, sessionId);
  }

  @Delete('remove/:productId')
  async remove(
    @Param('productId') productId: string,
    @Headers('authorization') authHeader?: string,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.extractUserOrSession(authHeader, sessionHeader);
    return this.comparisonService.remove(Number(productId), userId, sessionId);
  }

  @Get()
  async getComparisonList(
    @Headers('authorization') authHeader?: string,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.extractUserOrSession(authHeader, sessionHeader);
    return this.comparisonService.getComparisonList(userId, sessionId);
  }

  @Get('compare')
  async getCompareData(
    @Headers('authorization') authHeader?: string,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.extractUserOrSession(authHeader, sessionHeader);
    return this.comparisonService.getCompareData(userId, sessionId);
  }

  @Delete('clear')
  async clear(
    @Headers('authorization') authHeader?: string,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.extractUserOrSession(authHeader, sessionHeader);
    await this.comparisonService.clear(userId, sessionId);
    return { success: true };
  }
}
