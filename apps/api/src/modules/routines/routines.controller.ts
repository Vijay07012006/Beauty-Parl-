import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { RoutinesService } from './routines.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('routine-builder')
export class RoutinesController {
  constructor(private readonly routineService: RoutinesService) {}

  @Post('analyze')
  async analyze(@Body() body: { skinType: string; primaryConcern: string }) {
    return this.routineService.analyze(body);
  }

  @Post('save')
  @UseGuards(JwtAuthGuard)
  async save(
    @Body() body: { name: string; products: any },
    @Req() req: Request,
  ) {
    const userId = (req.user as { id: number }).id;
    return this.routineService.saveRoutine(body.name, body.products, userId);
  }

  @Get('my-routines')
  @UseGuards(JwtAuthGuard)
  async listMyRoutines(@Req() req: Request) {
    const userId = (req.user as { id: number }).id;
    return this.routineService.list(userId);
  }
}
