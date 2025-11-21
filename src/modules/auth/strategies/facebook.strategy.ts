import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  private readonly isEnabled: boolean;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('facebook.clientID') || '';
    const clientSecret = configService.get<string>('facebook.clientSecret') || '';
    const isEnabled = !!(clientID && clientSecret && clientID !== '' && clientSecret !== '');
    
    super({
      clientID: isEnabled ? clientID : 'disabled',
      clientSecret: isEnabled ? clientSecret : 'disabled',
      callbackURL: isEnabled
        ? (configService.get<string>('facebook.callbackURL') || '')
        : 'disabled',
      scope: 'email',
      profileFields: ['emails', 'name'],
    });
    
    this.isEnabled = isEnabled;
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    if (!this.isEnabled) {
      return done(new Error('Facebook OAuth is not configured'), null);
    }

    const { id, name, emails } = profile;
    const email = emails?.[0]?.value;

    if (!id || !email) {
      return done(new Error('Invalid Facebook profile'), null);
    }

    try {
      const user = await this.authService.validateOrCreateOAuthUser({
        provider: 'facebook',
        providerId: id,
        email,
        firstName: name?.givenName || null,
        lastName: name?.familyName || null,
      });

      const jwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      return done(null, { user, accessToken: this.authService.generateToken(jwtPayload) });
    } catch (error) {
      return done(error, null);
    }
  }
}