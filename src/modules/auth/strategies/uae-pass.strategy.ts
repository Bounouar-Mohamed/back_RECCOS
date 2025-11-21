import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * Stratégie Passport pour UAE Pass
 * UAE Pass utilise OAuth 2.0 / OpenID Connect
 */
@Injectable()
export class UaePassStrategy extends PassportStrategy(Strategy, 'uae-pass') {
  private readonly isEnabled: boolean;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('uaePass.clientId') || '';
    const clientSecret = configService.get<string>('uaePass.clientSecret') || '';
    const isEnabled = !!(clientID && clientSecret && clientID !== '' && clientSecret !== '');
    
    super({
      authorizationURL: isEnabled
        ? (configService.get<string>('uaePass.authorizationUrl') || '')
        : 'disabled',
      tokenURL: isEnabled
        ? (configService.get<string>('uaePass.tokenUrl') || '')
        : 'disabled',
      clientID: isEnabled ? clientID : 'disabled',
      clientSecret: isEnabled ? clientSecret : 'disabled',
      callbackURL: isEnabled
        ? (configService.get<string>('uaePass.redirectUri') || '')
        : 'disabled',
      scope: configService.get<string>('uaePass.scope')?.split(' ') || ['openid', 'profile', 'email'],
    });
    
    this.isEnabled = isEnabled;
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    if (!this.isEnabled) {
      return done(new Error('UAE Pass OAuth is not configured'), null);
    }

    try {
      // Récupérer les informations utilisateur depuis UAE Pass
      const userInfoUrl = this.configService.get<string>('uaePass.userInfoUrl');
      const response = await fetch(userInfoUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user info from UAE Pass');
      }

      const userInfo = await response.json();

      // Créer ou mettre à jour l'utilisateur
      const user = await this.authService.validateOrCreateUaePassUser(userInfo);

      // Note: lastLogin sera mis à jour dans validateOrCreateUaePassUser

      // Générer un JWT token pour l'utilisateur
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

