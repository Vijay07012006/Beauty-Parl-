import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SkinAnalysisService } from './skin-analysis.service';

@Controller('skin-analysis')
export class SkinAnalysisController {
  constructor(
    private readonly saService: SkinAnalysisService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('analyze')
  async analyze(
    @Body() body: { imageUrl: string },
    @Headers('authorization') authHeader?: string,
  ) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication token missing or invalid');
    }

    let userId: number;
    try {
      const token = authHeader.split(' ')[1];
      const payload = this.jwtService.verify(token);
      userId = Number(payload.sub);
    } catch {
      throw new UnauthorizedException('Authentication token signature verification failed');
    }

    return this.saService.analyze(body.imageUrl, userId);
  }
}
