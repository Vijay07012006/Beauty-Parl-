import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { ActiveSession } from './active-session.entity';
import { FailedLogin } from './failed-login.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepo: Repository<AuditLog>,
    @InjectRepository(ActiveSession)
    private activeSessionRepo: Repository<ActiveSession>,
    @InjectRepository(FailedLogin)
    private failedLoginRepo: Repository<FailedLogin>,
    @Inject(forwardRef(() => EmailService))
    private emailService: EmailService,
  ) {}

  private async getGeoLocation(ip: string): Promise<string> {
    if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return 'Localhost / Internal';
    }
    try {
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city`);
      if (res.ok) {
        const data: any = await res.json();
        if (data && data.status === 'success') {
          return `${data.city || ''}, ${data.country || ''}`.trim() || 'Unknown';
        }
      }
    } catch (err) {
      console.error('GeoIP resolution failed:', err);
    }
    return 'Unknown';
  }

  // Supporting both Object param and positional arguments signature for absolute compatibility.
  async log(
    actionOrParams: string | {
      action: string;
      userEmail?: string;
      userId?: number;
      details?: any;
      ipAddress?: string;
      userAgent?: string;
      sessionId?: string;
      entityType?: string;
      entityId?: number;
      beforeValue?: any;
      afterValue?: any;
      status?: 'success' | 'failed';
    },
    userEmail?: string,
    userId?: number,
    details?: any,
    ipAddress?: string,
    userAgent?: string,
    sessionId?: string,
    entityType?: string,
    entityId?: number,
    beforeValue?: any,
    afterValue?: any,
    status: 'success' | 'failed' = 'success',
  ): Promise<AuditLog> {
    try {
      let actionStr: string;
      let emailVal: string | undefined = userEmail;
      let userIdVal: number | undefined = userId;
      let detailsVal: any = details;
      let ipVal: string | undefined = ipAddress;
      let uaVal: string | undefined = userAgent;
      let sessVal: string | undefined = sessionId;
      let entTypeVal: string | undefined = entityType;
      let entIdVal: number | undefined = entityId;
      let beforeVal: any = beforeValue;
      let afterVal: any = afterValue;
      let statusVal: string = status;

      if (typeof actionOrParams === 'object' && actionOrParams !== null) {
        actionStr = actionOrParams.action;
        emailVal = actionOrParams.userEmail;
        userIdVal = actionOrParams.userId;
        detailsVal = actionOrParams.details;
        ipVal = actionOrParams.ipAddress;
        uaVal = actionOrParams.userAgent;
        sessVal = actionOrParams.sessionId;
        entTypeVal = actionOrParams.entityType;
        entIdVal = actionOrParams.entityId;
        beforeVal = actionOrParams.beforeValue;
        afterVal = actionOrParams.afterValue;
        statusVal = actionOrParams.status || 'success';
      } else {
        actionStr = actionOrParams;
      }

      const location = ipVal ? await this.getGeoLocation(ipVal) : undefined;
      const detailsStr = detailsVal ? (typeof detailsVal === 'string' ? detailsVal : JSON.stringify(detailsVal)) : undefined;

      const logEntry = this.auditLogRepo.create({
        action: actionStr,
        userEmail: emailVal,
        userId: userIdVal,
        details: detailsStr,
        ipAddress: ipVal,
        userAgent: uaVal,
        sessionId: sessVal,
        entityType: entTypeVal,
        entityId: entIdVal,
        beforeValue: beforeVal,
        afterValue: afterVal,
        location,
        status: statusVal,
      });

      const savedLog = await this.auditLogRepo.save(logEntry);

      // Alert check for suspicious logins (new location or new device)
      if (actionStr === 'USER_LOGIN' && statusVal === 'success' && userIdVal && emailVal && location) {
        const lastLogins = await this.auditLogRepo.find({
          where: { userId: userIdVal, action: 'USER_LOGIN', status: 'success' },
          order: { createdAt: 'DESC' },
          take: 2,
        });
        const lastLogin = lastLogins[1];

        if (lastLogin && lastLogin.location && lastLogin.location !== 'Unknown' && location !== 'Unknown') {
          if (lastLogin.location !== location) {
            await this.emailService.sendSecurityAlertEmail(emailVal, 'suspicious_login', {
              ipAddress: ipVal,
              userAgent: uaVal,
              location,
            });
          }
        }
      }

      return savedLog;
    } catch (error) {
      console.error('Failed to save audit log:', error);
      return {} as AuditLog;
    }
  }

  async trackSession(userId: number, sessionId: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const location = ipAddress ? await this.getGeoLocation(ipAddress) : 'Unknown';
      let session = await this.activeSessionRepo.findOne({ where: { sessionId } });

      if (session) {
        session.lastActivity = new Date();
        session.isActive = true;
        await this.activeSessionRepo.save(session);
      } else {
        session = this.activeSessionRepo.create({
          userId,
          sessionId,
          ipAddress,
          userAgent,
          location,
          isActive: true,
        });
        await this.activeSessionRepo.save(session);
      }
    } catch (error) {
      console.error('Failed to track active session:', error);
    }
  }

  async terminateSession(sessionId: string): Promise<void> {
    try {
      await this.activeSessionRepo.update({ sessionId }, { isActive: false });
    } catch (error) {
      console.error('Failed to terminate session:', error);
    }
  }

  async getActiveSessions(): Promise<ActiveSession[]> {
    return this.activeSessionRepo.find({
      where: { isActive: true },
      order: { lastActivity: 'DESC' },
    });
  }

  async recordFailedLogin(email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    try {
      const attempt = this.failedLoginRepo.create({
        email: email.trim().toLowerCase(),
        ipAddress,
        userAgent,
      });
      await this.failedLoginRepo.save(attempt);

      // Check failure count in last 15 minutes
      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const count = await this.failedLoginRepo.count({
        where: {
          email: email.trim().toLowerCase(),
          attemptTime: Between(fifteenMinsAgo, new Date()),
        },
      });

      if (count >= 3) {
        const location = ipAddress ? await this.getGeoLocation(ipAddress) : 'Unknown';
        await this.emailService.sendSecurityAlertEmail(email, 'failed_logins', {
          ipAddress,
          userAgent,
          location,
          count,
        });
      }
    } catch (error) {
      console.error('Failed to record failed login:', error);
    }
  }
}
