import { Controller, Get, Query, Headers } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('also-bought')
  async getAlsoBought(
    @Query('productId') productId: string,
    @Query('limit') limit?: string,
  ) {
    const id = parseInt(productId, 10);
    const max = limit ? parseInt(limit, 10) : 4;
    if (isNaN(id)) return [];
    return this.recommendationsService.getAlsoBought(id, max);
  }

  @Get('similar')
  async getSimilar(
    @Query('productId') productId: string,
    @Query('limit') limit?: string,
  ) {
    const id = parseInt(productId, 10);
    const max = limit ? parseInt(limit, 10) : 4;
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
    const max = limit ? parseInt(limit, 10) : 4;
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
