import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private config: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = config.get<string>('FACEBOOK_APP_ID') || process.env.FACEBOOK_APP_ID;
    const clientSecret = config.get<string>('FACEBOOK_APP_SECRET') || process.env.FACEBOOK_APP_SECRET;
    const callbackURL = config.get<string>('FACEBOOK_CALLBACK_URL') || process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:3001/auth/facebook/callback';

    if (!clientID || clientID === 'placeholder_id') {
      console.warn('⚠️ [FacebookStrategy] Missing FACEBOOK_APP_ID. Facebook OAuth will fail on invocation.');
    }

    super({
      clientID: clientID || 'placeholder_id',
      clientSecret: clientSecret || 'placeholder_secret',
      callbackURL,
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails && emails.length > 0 ? emails[0].value : `${profile.id}@facebook.placeholder.com`,
      name: `${name?.givenName || ''} ${name?.familyName || ''}`.trim() || 'Facebook User',
      avatar: photos && photos.length > 0 ? photos[0].value : null,
      facebookId: profile.id,
    };
    const ipAddress = req?.ip;
    const userAgent = req?.headers?.['user-agent'];
    const validatedUser = await this.authService.validateOAuthUser(user, 'facebook', { ipAddress, userAgent });
    done(null, validatedUser);
  }
}
