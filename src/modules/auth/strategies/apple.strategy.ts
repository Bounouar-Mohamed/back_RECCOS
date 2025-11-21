import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  private readonly isEnabled: boolean;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('apple.clientID') || '';
    const privateKey = configService.get<string>('apple.privateKey') || '';
    const isEnabled = !!(clientID && privateKey && clientID !== '' && privateKey !== '');
    
    super({
      clientID: isEnabled ? clientID : 'disabled',
      teamID: isEnabled 
        ? (configService.get<string>('apple.teamID') || '')
        : 'disabled',
      keyID: isEnabled
        ? (configService.get<string>('apple.keyID') || '')
        : 'disabled',
      privateKey: isEnabled ? privateKey : 'disabled',
      callbackURL: isEnabled
        ? (configService.get<string>('apple.callbackURL') || '')
        : 'disabled',
      scope: ['name', 'email'],
    });
    
    this.isEnabled = isEnabled;
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    if (!this.isEnabled) {
      return done(new Error('Apple OAuth is not configured'), null);
    }

    // Apple peut ne pas fournir l'email dans le profil initial
    // Il faut le décoder depuis idToken (JWT)
    let email: string | null = null;
    let firstName: string | null = null;
    let lastName: string | null = null;

    try {
      // Décoder le JWT idToken pour obtenir l'email
      if (idToken) {
        const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
        email = payload.email || null;
      }

      // Si l'email n'est pas dans le token, utiliser le profil
      if (!email && profile?.email) {
        email = profile.email;
      }

      // Récupérer le nom depuis le profil (Apple peut l'envoyer dans la première requête)
      if (profile?.name) {
        firstName = profile.name.firstName || null;
        lastName = profile.name.lastName || null;
      }

      if (!email) {
        return done(new Error('Email not provided by Apple'), null);
      }

      const user = await this.authService.validateOrCreateOAuthUser({
        provider: 'apple',
        providerId: profile.id || idToken,
        email,
        firstName,
        lastName,
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









