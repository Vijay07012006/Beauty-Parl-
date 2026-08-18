import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Request,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { GdprService } from './gdpr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

@Controller('gdpr')
export class GdprController {
  constructor(
    private readonly gdprService: GdprService,
    private readonly jwtService: JwtService,
  ) {}

  @Post('export')
  @UseGuards(JwtAuthGuard)
  async requestExport(@Request() req: any) {
    const token = await this.gdprService.generateExportToken(req.user.id);
    return {
      success: true,
      token,
      downloadUrl: `/api/gdpr/export/${token}`,
    };
  }

  @Get('export/:token')
  async downloadExport(
    @Param('token') token: string,
    @Query('format') format: string,
    @Res() res: Response,
  ) {
    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch (err) {
      throw new BadRequestException('Invalid or expired export token');
    }

    const userId = payload.sub;
    const data = await this.gdprService.getExportData(userId);

    if (format === 'csv') {
      const csv = this.gdprService.formatAsCsv(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=gdpr-export-${userId}-${Date.now()}.csv`,
      );
      return res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=gdpr-export-${userId}-${Date.now()}.json`,
      );
      return res.json(data);
    }
  }

  @Post('delete')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Request() req: any) {
    return this.gdprService.createDeletionRequest(req.user.id);
  }

  @Post('delete/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelDeleteAccount(@Request() req: any) {
    return this.gdprService.cancelDeletionRequest(req.user.id);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Request() req: any) {
    return this.gdprService.getGdprStatus(req.user.id);
  }
}
