import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from '../audit-logs/audit-log.entity';
import { AuditExportService } from './audit-export.service';
import { AuditController } from './audit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditExportService],
  controllers: [AuditController],
  exports: [AuditExportService],
})
export class AuditModule {}
