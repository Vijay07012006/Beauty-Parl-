import { Controller, Post, Body, Headers, UnauthorizedException, BadRequestException } from '@nestjs/common';
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

    // imageUrl is required, a string, and bounded (entity column is varchar(500))
    if (typeof body?.imageUrl !== 'string' || body.imageUrl.length === 0) {
      throw new BadRequestException('imageUrl is required');
    }
    if (body.imageUrl.length > 500) {
      throw new BadRequestException('imageUrl is too long');
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
