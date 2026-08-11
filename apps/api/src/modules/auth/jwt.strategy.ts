import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UserSession } from './user-session.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
  ) {
    const jwtSecret = config.get<string>('jwt.secret') || process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required. Refusing to start with an insecure default secret.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token');
    }
    const rawToken = authHeader.substring(7);
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex').substring(0, 64);

    const session = await this.userSessionRepository.findOne({
      where: { userId: payload.sub, tokenHash },
    });

    if (!session) {
      throw new UnauthorizedException('Session has been revoked');
    }

    await this.userSessionRepository.update(
      session.id,
      { lastActivityAt: new Date() },
    );

    return { id: payload.sub, email: payload.email, role: payload.role, sessionId: session.id };
  }
}
