import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { RecommendationsService } from './recommendations.service';
import { OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
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
  @UseGuards(OptionalJwtAuthGuard)
  async getPersonalized(
    @Req() req: Request,
    @Query('limit') limit?: string,
  ) {
    const max = this.safeLimit(limit);
    const user = req.user as { id?: number } | undefined;
    const userId = user?.id ?? null;
    return this.recommendationsService.getPersonalized(userId, max);
  }
}