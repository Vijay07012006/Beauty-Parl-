import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from '../auth/user-session.entity';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
  ) {}

  async getActiveSessions(userId: number) {
    return this.userSessionRepository.find({
      where: { userId, isActive: true },
      order: { lastActivity: 'DESC' },
    });
  }

  async logoutSession(userId: number, sessionId: string) {
    const session = await this.userSessionRepository.findOne({
      where: { sessionId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.userId !== userId) {
      throw new ForbiddenException('Not authorized to revoke this session');
    }
    session.isActive = false;
    await this.userSessionRepository.save(session);
  }

  async logoutAllOtherSessions(userId: number, currentSessionId: string) {
    await this.userSessionRepository.createQueryBuilder()
      .update(UserSession)
      .set({ isActive: false })
      .where('userId = :userId AND sessionId != :currentSessionId', { userId, currentSessionId })
      .execute();
  }
}
