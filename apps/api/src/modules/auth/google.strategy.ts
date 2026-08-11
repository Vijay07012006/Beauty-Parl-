import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID') || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET') || process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = config.get<string>('GOOGLE_CALLBACK_URL') || process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback';

    if (!clientID || clientID === 'placeholder_id') {
      console.warn('⚠️ [GoogleStrategy] Missing GOOGLE_CLIENT_ID. Google OAuth will fail on invocation.');
    }

    super({
      clientID: clientID || 'placeholder_id',
      clientSecret: clientSecret || 'placeholder_secret',
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      name: `${name.givenName || ''} ${name.familyName || ''}`.trim() || 'Google User',
      avatar: photos && photos.length > 0 ? photos[0].value : null,
      googleId: profile.id,
    };
    const ipAddress = req?.ip;
    const userAgent = req?.headers?.['user-agent'];
    const validatedUser = await this.authService.validateOAuthUser(user, 'google', { ipAddress, userAgent });
    done(null, validatedUser);
  }
}
