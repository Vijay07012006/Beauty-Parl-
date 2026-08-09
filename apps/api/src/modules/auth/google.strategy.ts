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
    super({
      clientID: config.get('GOOGLE_CLIENT_ID') || 'placeholder_id',
      clientSecret: config.get('GOOGLE_CLIENT_SECRET') || 'placeholder_secret',
      callbackURL: config.get('GOOGLE_CALLBACK_URL') || 'http://localhost:3001/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
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
    const validatedUser = await this.authService.validateOAuthUser(user, 'google');
    done(null, validatedUser);
  }
}
