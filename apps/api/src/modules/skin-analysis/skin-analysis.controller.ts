import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { SkinAnalysisService } from './skin-analysis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('skin-analysis')
export class SkinAnalysisController {
  constructor(private readonly saService: SkinAnalysisService) {}

  @Post('analyze')
  @UseGuards(JwtAuthGuard)
  async analyze(@Body() body: { imageUrl: string }, @Req() req: Request) {
    const userId = (req.user as { id: number }).id;

    // imageUrl is required, a string, and bounded (entity column is varchar(500))
    if (typeof body?.imageUrl !== 'string' || body.imageUrl.length === 0) {
      throw new BadRequestException('imageUrl is required');
    }
    if (body.imageUrl.length > 500) {
      throw new BadRequestException('imageUrl is too long');
    }

    return this.saService.analyze(body.imageUrl, userId);
  }
}
