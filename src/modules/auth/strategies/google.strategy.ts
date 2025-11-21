import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  private readonly isEnabled: boolean;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('google.clientID') || '';
    const clientSecret = configService.get<string>('google.clientSecret') || '';
    const isEnabled = !!(clientID && clientSecret && clientID !== '' && clientSecret !== '');
    
    super({
      clientID: isEnabled ? clientID : 'disabled',
      clientSecret: isEnabled ? clientSecret : 'disabled',
      callbackURL: isEnabled 
        ? (configService.get<string>('google.callbackURL') || '')
        : 'disabled',
      scope: ['email', 'profile'],
    });
    
    this.isEnabled = isEnabled;
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    // Si la stratégie est désactivée, ne rien faire
    if (!this.isEnabled) {
      return done(new Error('Google OAuth is not configured'), null);
    }

    const { id, name, emails } = profile;
    const email = emails?.[0]?.value;

    if (!id || !email) {
      return done(new Error('Invalid Google profile'), null);
    }

    try {
      const user = await this.authService.validateOrCreateOAuthUser({
        provider: 'google',
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









