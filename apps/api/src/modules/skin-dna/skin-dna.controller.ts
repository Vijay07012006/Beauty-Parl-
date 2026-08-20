/* eslint-disable */
import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { SkinDnaService } from './skin-dna.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('skin-dna')
export class SkinDnaController {
  constructor(private readonly skinDnaService: SkinDnaService) {}

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  async getReport(@Param('userId') userId: string, @Req() req: Request) {
    const user = req.user as any;

    // Authorization Check: Only administrators or the user themselves can access this report
    if (
      user.role !== 'admin' &&
      user.role !== 'super_admin' &&
      Number(user.id) !== Number(userId)
    ) {
      throw new ForbiddenException(
        'Access denied. You can only view your own skin DNA report.',
      );
    }

    return await this.skinDnaService.getReport(Number(userId));
  }
}
