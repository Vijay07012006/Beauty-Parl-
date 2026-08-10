import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
  ) {}

  async log(
    action: string,
    userEmail?: string,
    userId?: number,
    details?: any,
    ipAddress?: string,
  ): Promise<AuditLog> {
    try {
      const detailsStr = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : undefined;
      const logEntry = this.auditLogRepo.create({
        action,
        userEmail,
        userId,
        details: detailsStr,
        ipAddress,
      });
      return await this.auditLogRepo.save(logEntry);
    } catch (error) {
      console.error('Failed to save audit log:', error);
      // We do not throw to prevent blocking the main request flow if logging fails
      return {} as AuditLog;
    }
  }
}
