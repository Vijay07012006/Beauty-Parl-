import { Controller, Get, Post, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { GamificationService } from './gamification.service';

@Controller('gamification')
export class GamificationController {
  constructor(
    private readonly gameService: GamificationService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(authHeader?: string): number {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token missing or invalid');
    }
    try {
      const token = authHeader.split(' ')[1];
      const payload = this.jwtService.verify(token);
      if (payload?.sub) return Number(payload.sub);
    } catch {}
    throw new UnauthorizedException('Authentication token signature verification failed');
  }

  @Get('achievements')
  async getAchievements(@Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);
    return this.gameService.getAchievements(userId);
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.gameService.getLeaderboard();
  }

  @Post('trigger/:type')
  async trigger(
    @Param('type') type: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = this.extractUserId(authHeader);
    const unlocked = await this.gameService.triggerAchievement(userId, type);
    return { success: true, unlocked };
  }
}
