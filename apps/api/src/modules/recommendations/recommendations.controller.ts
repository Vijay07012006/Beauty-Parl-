import { Controller, Get, Query, Headers } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly jwtService: JwtService,
  ) {}

  private safeLimit(limit?: string): number {
    const parsed = parseInt(limit || '4', 10);
    if (isNaN(parsed)) return 4;
    return Math.max(1, Math.min(20, parsed)); // cap to avoid resource exhaustion (P8)
  }

  @Get('also-bought')
  async getAlsoBought(
    @Query('productId') productId: string,
    @Query('limit') limit?: string,
  ) {
    const id = parseInt(productId, 10);
    const max = this.safeLimit(limit);
    if (isNaN(id)) return [];
    return this.recommendationsService.getAlsoBought(id, max);
  }

  @Get('similar')
  async getSimilar(
    @Query('productId') productId: string,
    @Query('limit') limit?: string,
  ) {
    const id = parseInt(productId, 10);
    const max = this.safeLimit(limit);
    if (isNaN(id)) {
      // Return popular items if no productId is provided
      return this.recommendationsService.getPopular(max);
    }
    return this.recommendationsService.getSimilar(id, max);
  }

  @Get('personalized')
  async getPersonalized(
    @Headers('authorization') authHeader?: string,
    @Query('limit') limit?: string,
  ) {
    const max = this.safeLimit(limit);
    let userId: number | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token);
        userId = payload.sub ? Number(payload.sub) : null;
      } catch (err) {
        // Token expired or invalid — fallback to guest
      }
    }

    return this.recommendationsService.getPersonalized(userId, max);
  }
}
