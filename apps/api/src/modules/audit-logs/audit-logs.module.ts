import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { ActiveSession } from './active-session.entity';
import { FailedLogin } from './failed-login.entity';
import { AuditLogsService } from './audit-logs.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, ActiveSession, FailedLogin])],
  providers: [AuditLogsService],
  exports: [AuditLogsService, TypeOrmModule],
})
export class AuditLogsModule {}
