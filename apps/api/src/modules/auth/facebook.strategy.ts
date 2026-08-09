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
    super({
      clientID: config.get('FACEBOOK_APP_ID') || 'placeholder_id',
      clientSecret: config.get('FACEBOOK_APP_SECRET') || 'placeholder_secret',
      callbackURL: config.get('FACEBOOK_CALLBACK_URL') || 'http://localhost:3001/auth/facebook/callback',
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    });
  }

  async validate(
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
    const validatedUser = await this.authService.validateOAuthUser(user, 'facebook');
    done(null, validatedUser);
  }
}
