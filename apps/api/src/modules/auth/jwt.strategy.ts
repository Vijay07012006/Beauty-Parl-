import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { UserSession } from './user-session.entity';
import { User } from './user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(UserSession)
    private userSessionRepository: Repository<UserSession>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    const jwtSecret = config.get<string>('jwt.secret') || process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required. Refusing to start with an insecure default secret.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
      issuer: 'beauty-parle-api',
      audience: 'beauty-parle-web',
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

    // Reject deactivated accounts even with a valid, un-revoked token (H2)
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: { id: true, isActive: true },
    });
    if (!user || user.isActive === false) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    await this.userSessionRepository.update(
      session.id,
      { lastActivityAt: new Date() },
    );

    return { id: payload.sub, email: payload.email, role: payload.role, sessionId: session.id };
  }
}
