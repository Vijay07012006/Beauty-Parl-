import { Controller, Get, Post, Body, Headers, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoutinesService } from './routines.service';

@Controller('routine-builder')
export class RoutinesController {
  constructor(
    private readonly routineService: RoutinesService,
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

  @Post('analyze')
  async analyze(@Body() body: { skinType: string; primaryConcern: string }) {
    return this.routineService.analyze(body);
  }

  @Post('save')
  async save(
    @Body() body: { name: string; products: any },
    @Headers('authorization') authHeader?: string,
  ) {
    const userId = this.extractUserId(authHeader);
    return this.routineService.saveRoutine(body.name, body.products, userId);
  }

  @Get('my-routines')
  async listMyRoutines(@Headers('authorization') authHeader?: string) {
    const userId = this.extractUserId(authHeader);
    return this.routineService.list(userId);
  }
}
