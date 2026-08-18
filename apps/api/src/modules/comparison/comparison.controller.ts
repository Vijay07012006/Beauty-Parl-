import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Headers,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ComparisonService } from './comparison.service';
import { OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comparison')
export class ComparisonController {
  constructor(private readonly comparisonService: ComparisonService) {}

  private userOrSession(req: Request, sessionHeader?: string) {
    const user = req.user;
    return { userId: user?.id, sessionId: sessionHeader };
  }

  @Post('add/:productId')
  @UseGuards(OptionalJwtAuthGuard)
  async add(
    @Param('productId') productId: string,
    @Req() req: Request,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.userOrSession(req, sessionHeader);
    return this.comparisonService.add(Number(productId), userId, sessionId);
  }

  @Delete('remove/:productId')
  @UseGuards(OptionalJwtAuthGuard)
  async remove(
    @Param('productId') productId: string,
    @Req() req: Request,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.userOrSession(req, sessionHeader);
    return this.comparisonService.remove(Number(productId), userId, sessionId);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getComparisonList(
    @Req() req: Request,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.userOrSession(req, sessionHeader);
    return this.comparisonService.getComparisonList(userId, sessionId);
  }

  @Get('compare')
  @UseGuards(OptionalJwtAuthGuard)
  async getCompareData(
    @Req() req: Request,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.userOrSession(req, sessionHeader);
    return this.comparisonService.getCompareData(userId, sessionId);
  }

  @Delete('clear')
  @UseGuards(OptionalJwtAuthGuard)
  async clear(
    @Req() req: Request,
    @Headers('x-session-id') sessionHeader?: string,
  ) {
    const { userId, sessionId } = this.userOrSession(req, sessionHeader);
    await this.comparisonService.clear(userId, sessionId);
    return { success: true };
  }
}
