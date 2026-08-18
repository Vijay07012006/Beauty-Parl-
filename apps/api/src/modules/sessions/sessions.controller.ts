import {
  Controller,
  Get,
  Delete,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  async getSessions(@Request() req: any) {
    return this.sessionsService.getActiveSessions(req.user.id);
  }

  @Delete('all')
  async logoutAllOther(@Request() req: any) {
    await this.sessionsService.logoutAllOtherSessions(
      req.user.id,
      req.user.sessionId,
    );
    return { success: true, message: 'Logged out other devices' };
  }

  @Delete(':sessionId')
  async logoutSpecific(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
  ) {
    await this.sessionsService.logoutSession(req.user.id, sessionId);
    return { success: true, message: 'Logged out specific session' };
  }
}
