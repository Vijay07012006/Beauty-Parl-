import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from '../audit-logs/audit-log.entity';
import PDFDocument = require('pdfkit');

@Injectable()
export class AuditExportService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
  ) {}

  async getLogs(filters: { startDate?: string; endDate?: string; userId?: number; action?: string }) {
    const where: any = {};
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? new Date(filters.startDate) : new Date(0);
      const end = filters.endDate ? new Date(filters.endDate) : new Date();
      where.createdAt = Between(start, end);
    }
    if (filters.userId) {
      where.userId = filters.userId;
    }
    if (filters.action) {
      where.action = filters.action;
    }
    return this.auditLogRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async exportCsv(filters: any): Promise<string> {
    const logs = await this.getLogs(filters);
    if (logs.length === 0) {
      return 'id,userId,userEmail,action,ipAddress,location,status,createdAt\n';
    }
    const headers = ['id', 'userId', 'userEmail', 'action', 'ipAddress', 'location', 'status', 'createdAt'];
    const rows = [headers.join(',')];
    for (const log of logs) {
      const row = [
        log.id,
        log.userId || '',
        log.userEmail || '',
        log.action,
        log.ipAddress || '',
        log.location || '',
        log.status || '',
        log.createdAt.toISOString(),
      ].map(v => `"${('' + v).replace(/"/g, '""')}"`);
      rows.push(row.join(','));
    }
    return rows.join('\n');
  }

  async exportPdf(filters: any): Promise<Buffer> {
    const logs = await this.getLogs(filters);
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: any) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err: any) => reject(err));

      // Title
      doc.fontSize(18).font('Helvetica-Bold').text('Beauty Parlé - Audit Logs Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Generated at: ${new Date().toLocaleString()}`, { align: 'right' });
      doc.moveDown();

      // Filters Summary
      doc.fontSize(11).font('Helvetica-Bold').text('Report Filters:', { underline: true });
      doc.font('Helvetica').text(`Date Range: ${filters.startDate || 'All'} to ${filters.endDate || 'All'}`);
      if (filters.userId) doc.text(`User ID: ${filters.userId}`);
      if (filters.action) doc.text(`Action: ${filters.action}`);
      doc.moveDown(2);

      // Table Header
      doc.fontSize(9);
      const startX = 30;
      let startY = doc.y;

      doc.font('Helvetica-Bold');
      doc.text('Date', startX, startY);
      doc.text('User', startX + 110, startY);
      doc.text('Action', startX + 220, startY);
      doc.text('IP Address', startX + 340, startY);
      doc.text('Status', startX + 460, startY);

      doc.moveTo(startX, startY + 12).lineTo(565, startY + 12).stroke();
      startY += 18;
      doc.font('Helvetica');

      for (const log of logs) {
        if (startY > 750) {
          doc.addPage();
          startY = 30;
          doc.font('Helvetica-Bold');
          doc.text('Date', startX, startY);
          doc.text('User', startX + 110, startY);
          doc.text('Action', startX + 220, startY);
          doc.text('IP Address', startX + 340, startY);
          doc.text('Status', startX + 460, startY);
          doc.moveTo(startX, startY + 12).lineTo(565, startY + 12).stroke();
          startY += 18;
          doc.font('Helvetica');
        }

        const dateStr = log.createdAt.toLocaleString();
        const userStr = log.userEmail || (log.userId ? `ID: ${log.userId}` : 'System/Guest');
        const actionStr = log.action;
        const ipStr = `${log.ipAddress || ''} (${log.location || 'Unknown'})`;
        const statusStr = log.status || 'success';

        doc.text(dateStr, startX, startY, { width: 100, height: 12 });
        doc.text(userStr, startX + 110, startY, { width: 100, height: 12 });
        doc.text(actionStr, startX + 220, startY, { width: 110, height: 12 });
        doc.text(ipStr, startX + 340, startY, { width: 110, height: 12 });
        doc.text(statusStr, startX + 460, startY, { width: 60, height: 12 });

        startY += 18;
      }

      doc.end();
    });
  }
}
