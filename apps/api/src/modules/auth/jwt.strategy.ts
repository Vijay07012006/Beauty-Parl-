import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UserSession } from './user-session.entity';
import { User } from './user.entity';

const COOKIE_NAME = 'bp_token';

// HttpOnly cookie is the primary transport (XSS can't read it); the Authorization
// header remains as a fallback for clients that cannot send cross-site cookies.
function extractFromCookie(req: any): string | null {
  const cookieHeader = req?.headers?.cookie;
  if (!cookieHeader || typeof cookieHeader !== 'string') return null;
  for (const part of cookieHeader.split(';')) {
    const pair = part.trim();
    if (pair.startsWith(`${COOKIE_NAME}=`)) {
      return pair.substring(COOKIE_NAME.length + 1);
    }
  }
  return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const jwtSecret =
      config.get<string>('jwt.secret') || process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error(
        'JWT_SECRET environment variable is required. Refusing to start with an insecure default secret.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
      issuer: 'beauty-parle-api',
      audience: 'beauty-parle-web',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
    const sessionId = payload.sessionId || payload.sid;
    if (!sessionId) {
      throw new UnauthorizedException('Invalid token session');
    }

    const session = await this.userSessionRepository.findOne({
      where: { sessionId, isActive: true },
    });

    if (!session) {
      throw new UnauthorizedException(
        'Session has been revoked or is inactive',
      );
    }

    // Reject deactivated accounts even with a valid, un-revoked token (H2)
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: { id: true, isActive: true },
    });
    if (!user || user.isActive === false) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    await this.userSessionRepository.update(session.id, {
      lastActivity: new Date(),
    });

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: session.sessionId,
    };
  }
}
