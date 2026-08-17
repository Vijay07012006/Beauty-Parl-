import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuditExportService } from './audit-export.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AuditController {
  constructor(private readonly auditExportService: AuditExportService) {}

  @Get('export/csv')
  async exportCsv(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userId') userId: string,
    @Query('action') action: string,
    @Res() res: Response,
  ) {
    const csvContent = await this.auditExportService.exportCsv({
      startDate,
      endDate,
      userId: userId ? Number(userId) : undefined,
      action,
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
    return res.send(csvContent);
  }

  @Get('export/pdf')
  async exportPdf(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userId') userId: string,
    @Query('action') action: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.auditExportService.exportPdf({
      startDate,
      endDate,
      userId: userId ? Number(userId) : undefined,
      action,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.pdf`);
    return res.send(pdfBuffer);
  }
}
