import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { EmailService } from '../../common/services/email.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { randomBytes, timingSafeEqual, createHash } from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_MINUTES = 30;
  private readonly MAX_2FA_ATTEMPTS = 3;
  private readonly TWO_FA_CODE_EXPIRY_MINUTES = 10;
  private readonly accessTokenTtlMs: number;
  private readonly refreshTokenTtlMs: number;
  private readonly heartbeatIntervalSeconds: number;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    this.accessTokenTtlMs = this.parseDurationToMs(this.configService.get('jwt.expiresIn') || '24h');
    this.refreshTokenTtlMs = this.resolveRefreshTokenTtlMs();
    this.heartbeatIntervalSeconds = this.configService.get<number>('session.heartbeatIntervalSeconds') ?? 240;
  }

  private parseDurationToMs(duration: string | number): number {
    if (typeof duration === 'number' && Number.isFinite(duration)) {
      return duration * 1000;
    }

    const value = typeof duration === 'string' ? duration.trim().toLowerCase() : '';
    const match = value.match(/^(\d+)\s*(s|m|h|d)?$/i);

    if (match) {
      const amount = Number(match[1]);
      const unit = match[2]?.toLowerCase() ?? 's';

      switch (unit) {
        case 'd':
          return amount * 24 * 60 * 60 * 1000;
        case 'h':
          return amount * 60 * 60 * 1000;
        case 'm':
          return amount * 60 * 1000;
        case 's':
        default:
          return amount * 1000;
      }
    }

    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
      return numericValue * 1000;
    }

    // Fallback: 24h
    return 24 * 60 * 60 * 1000;
  }

  private resolveRefreshTokenTtlMs(): number {
    const refreshDays = this.configService.get<number>('session.refreshTokenDays');
    if (refreshDays && refreshDays > 0) {
      return refreshDays * 24 * 60 * 60 * 1000;
    }
    const refreshDuration = this.configService.get('jwt.refreshExpiresIn') || '30d';
    return this.parseDurationToMs(refreshDuration);
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private mapUserResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username || '',
      role: user.role,
      emailVerified: user.emailVerified ?? true,
      isActive: user.isActive ?? true,
    };
  }

  private async buildSessionResponse(user: any) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);
    const accessExpiresAt = new Date(Date.now() + this.accessTokenTtlMs);

    const refresh_token = randomBytes(64).toString('hex');
    const refreshExpiresAt = new Date(Date.now() + this.refreshTokenTtlMs);
    const refreshHash = this.hashToken(refresh_token);

    await this.usersService.setRefreshToken(user.id, refreshHash, refreshExpiresAt);

    return {
      access_token,
      refresh_token,
      expiresAt: accessExpiresAt.toISOString(),
      refreshExpiresAt: refreshExpiresAt.toISOString(),
      user: this.mapUserResponse(user),
      session: {
        lastHeartbeatAt: new Date().toISOString(),
        heartbeatIntervalSeconds: this.heartbeatIntervalSeconds,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto, ipAddress?: string) {
    // Vérifier si le compte est verrouillé
    const userByEmail = await this.usersService.findByEmail(loginDto.email);
    if (userByEmail) {
      if (userByEmail.accountLockedUntil && userByEmail.accountLockedUntil.getTime() > Date.now()) {
        const minutesLeft = Math.ceil((userByEmail.accountLockedUntil.getTime() - Date.now()) / 60000);
        this.logger.warn(`Login attempt on locked account: ${loginDto.email} from IP: ${ipAddress}`);
        throw new UnauthorizedException(`Account is locked. Try again in ${minutesLeft} minutes.`);
      }
      // Déverrouiller si la période est expirée
      if (userByEmail.accountLockedUntil && userByEmail.accountLockedUntil.getTime() <= Date.now()) {
        userByEmail.accountLockedUntil = null;
        userByEmail.failedLoginAttempts = 0;
        await this.usersService.save(userByEmail);
      }
    }

    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      // Incrémenter les tentatives échouées
      if (userByEmail) {
        userByEmail.failedLoginAttempts = (userByEmail.failedLoginAttempts || 0) + 1;

        if (userByEmail.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
          userByEmail.accountLockedUntil = new Date(
            Date.now() + this.LOCKOUT_DURATION_MINUTES * 60 * 1000,
          );
          this.logger.warn(`Account locked due to too many failed attempts: ${loginDto.email} from IP: ${ipAddress}`);
        }

        await this.usersService.save(userByEmail);
      }

      this.logger.warn(`Failed login attempt: ${loginDto.email} from IP: ${ipAddress}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException('Email not verified');
    }
    if (!user.isActive) {
      throw new ForbiddenException('ACCOUNT_DISABLED');
    }

    // Réinitialiser les tentatives échouées après un login réussi
    if (user.failedLoginAttempts > 0) {
      user.failedLoginAttempts = 0;
      user.accountLockedUntil = null;
      await this.usersService.save(user);
    }

    // Si 2FA est activée, vérifier le code (TOTP ou Email uniquement - SMS désactivé)
    if (user.twoFactorEnabled) {
      if (!(loginDto as any).twoFactorCode) {
        // Retourner un code spécifique pour indiquer que 2FA est requis
        // On utilise un message spécifique pour que le frontend puisse détecter ce cas
        throw new UnauthorizedException('2FA code required');
      }

      // Vérifier les tentatives 2FA
      if (user.failed2FAAttempts >= this.MAX_2FA_ATTEMPTS) {
        this.logger.warn(`Too many failed 2FA attempts: ${user.email} from IP: ${ipAddress}`);
        throw new UnauthorizedException('Too many failed 2FA attempts. Please try again later.');
      }

      const isValid = await this.verify2FACode(user, (loginDto as any).twoFactorCode, ipAddress);
      if (!isValid) {
        user.failed2FAAttempts = (user.failed2FAAttempts || 0) + 1;
        await this.usersService.save(user);
        this.logger.warn(`Failed 2FA attempt: ${user.email} from IP: ${ipAddress}`);
        throw new UnauthorizedException('Invalid 2FA code');
      }

      // Réinitialiser les tentatives 2FA après succès
      if (user.failed2FAAttempts > 0) {
        user.failed2FAAttempts = 0;
        await this.usersService.save(user);
      }
    }

    await this.usersService.updateLastLogin(user.id);

    this.logger.log(`Successful login: ${user.email} from IP: ${ipAddress}`);

    return this.buildSessionResponse(user);
  }

  /**
   * Générer un JWT token (méthode publique pour les stratégies OAuth)
   */
  generateToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }
    const existingUsername = await this.usersService.findByUsername(
      registerDto.username,
    );
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const saltRounds = this.configService.get('bcrypt.saltRounds');
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    const emailVerificationToken = randomBytes(32).toString('hex');
    const tokenTtlHours = 24;
    const expiresAt = new Date(Date.now() + tokenTtlHours * 60 * 60 * 1000);

    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      username: registerDto.username,
      dateOfBirth: registerDto.dateOfBirth ? new Date(registerDto.dateOfBirth) : null,
      country: registerDto.country,
      isActive: false,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationTokenExpiresAt: expiresAt,
    });

    await this.sendEmailVerification(user.email, emailVerificationToken);

    const { password: _, ...result } = user;
    return result;
  }

  private async sendEmailVerification(email: string, token: string) {
    try {
      const appUrl = this.configService.get<string>('app.url') || '';
      const verifyUrl = `${appUrl.replace(/\/+$/, '')}/api/auth/verify-email?token=${token}`;
      const subject = 'Verify your email';
      const html = `
      <p>Bienvenue !</p>
      <p>Veuillez confirmer votre adresse e‑mail en cliquant sur le lien suivant :</p>
      <p><a href="${verifyUrl}">Activer mon compte</a></p>
      <p>Ce lien expire dans 24 heures.</p>
    `;
      await this.emailService.sendMail(email, subject, html);
    } catch (error) {
      // L'erreur est déjà loggée dans EmailService, on continue quand même
      // L'utilisateur peut toujours utiliser le lien de vérification
    }
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Token is required');
    }
    const userByToken = await this.usersService.findByEmailVerificationToken(token);
    if (!userByToken) {
      throw new BadRequestException('Invalid token');
    }
    if (
      !userByToken.emailVerificationTokenExpiresAt ||
      userByToken.emailVerificationTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Token expired');
    }
    userByToken.emailVerified = true;
    userByToken.isActive = true;
    userByToken.emailVerificationToken = null;
    userByToken.emailVerificationTokenExpiresAt = null;
    await this.usersService.save(userByToken);
    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Do not reveal user existence
      return { message: 'If an account exists, a verification email was sent' };
    }
    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }
    const emailVerificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationTokenExpiresAt = expiresAt;
    await this.usersService.save(user);
    await this.sendEmailVerification(user.email, emailVerificationToken);
    return { message: 'Verification email resent' };
  }

  /**
   * Demander la réinitialisation du mot de passe
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto, ipAddress?: string) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Ne pas révéler l'existence de l'utilisateur
      // Mais logger quand même pour détecter les tentatives d'énumération
      this.logger.warn(`Password reset request for non-existent email: ${forgotPasswordDto.email} from IP: ${ipAddress}`);
      return { message: 'If an account exists, a password reset email was sent' };
    }

    // Vérifier si un reset a déjà été demandé récemment (rate limiting côté serveur)
    const recentResetThreshold = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes
    if (user.passwordResetTokenExpiresAt && user.passwordResetTokenExpiresAt > recentResetThreshold) {
      this.logger.warn(`Too frequent password reset request for: ${user.email} from IP: ${ipAddress}`);
      // Ne pas révéler que l'email existe
      return { message: 'If an account exists, a password reset email was sent' };
    }

    // Générer un token de réinitialisation
    const resetToken = randomBytes(32).toString('hex');
    const tokenTtlHours = 1; // Token valide 1 heure
    const expiresAt = new Date(Date.now() + tokenTtlHours * 60 * 60 * 1000);

    // Sauvegarder le token
    user.passwordResetToken = resetToken;
    user.passwordResetTokenExpiresAt = expiresAt;
    await this.usersService.save(user);

    // Envoyer l'email
    await this.sendPasswordResetEmail(user.email, resetToken);

    this.logger.log(`Password reset email sent to: ${user.email} from IP: ${ipAddress}`);

    return { message: 'If an account exists, a password reset email was sent' };
  }

  /**
   * Réinitialiser le mot de passe avec un token
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto, ipAddress?: string) {
    if (!resetPasswordDto.token) {
      throw new BadRequestException('Token is required');
    }

    // Hasher le token pour comparaison sécurisée
    const tokenHash = createHash('sha256').update(resetPasswordDto.token).digest('hex');

    // Trouver l'utilisateur par token
    const user = await this.usersService.findByPasswordResetToken(
      resetPasswordDto.token,
    );

    if (!user) {
      this.logger.warn(`Invalid password reset token attempt from IP: ${ipAddress}`);
      throw new BadRequestException('Invalid or expired token');
    }

    // Vérifier si le token a déjà été utilisé
    const usedTokens = user.usedResetTokens || [];
    if (usedTokens.includes(tokenHash)) {
      this.logger.warn(`Reused password reset token attempt for user: ${user.email} from IP: ${ipAddress}`);
      throw new BadRequestException('This reset token has already been used');
    }

    // Vérifier l'expiration
    if (
      !user.passwordResetTokenExpiresAt ||
      user.passwordResetTokenExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException('Token expired');
    }

    // Hasher le nouveau mot de passe
    const saltRounds = this.configService.get('bcrypt.saltRounds');
    const hashedPassword = await bcrypt.hash(
      resetPasswordDto.newPassword,
      saltRounds,
    );

    // Mettre à jour le mot de passe, supprimer le token et l'ajouter aux tokens utilisés
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetTokenExpiresAt = null;
    usedTokens.push(tokenHash);
    // Garder seulement les 10 derniers tokens utilisés
    user.usedResetTokens = usedTokens.slice(-10);
    await this.usersService.save(user);

    this.logger.log(`Password reset successful for user: ${user.email} from IP: ${ipAddress}`);

    return { message: 'Password reset successfully' };
  }

  /**
   * Envoyer l'email de réinitialisation du mot de passe
   */
  private async sendPasswordResetEmail(email: string, token: string) {
    try {
      const appUrl = this.configService.get<string>('app.url') || '';
      // L'URL doit pointer vers le frontend qui appellera ensuite l'API
      // Exemple: https://app.example.com/reset-password?token=...
      const resetUrl = `${appUrl.replace(/\/+$/, '')}/reset-password?token=${token}`;
      const subject = 'Réinitialisation de votre mot de passe';
      const html = `
        <p>Bonjour,</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien suivant pour définir un nouveau mot de passe :</p>
        <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
        <p>Ce lien expire dans 1 heure.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      `;
      await this.emailService.sendMail(email, subject, html);
    } catch (error) {
      // L'erreur est déjà loggée dans EmailService
    }
  }

  /**
   * Valider ou créer un utilisateur depuis UAE Pass
   */
  async validateOrCreateUaePassUser(uaePassUserInfo: any) {
    const uaePassId = uaePassUserInfo.sub || uaePassUserInfo.id;
    const email = uaePassUserInfo.email;

    if (!uaePassId || !email) {
      throw new BadRequestException('Invalid UAE Pass user info');
    }

    // Chercher un utilisateur existant par UAE Pass ID
    let user = await this.usersService.findByUaePassId(uaePassId);

    if (user) {
      // Utilisateur existe déjà, mettre à jour lastLogin
      await this.usersService.updateLastLogin(user.id);
      return user;
    }

    // Chercher par email
    user = await this.usersService.findByEmail(email);

    if (user) {
      // Lier UAE Pass à l'utilisateur existant
      user.uaePassId = uaePassId;
      await this.usersService.save(user);
      await this.usersService.updateLastLogin(user.id);
      return user;
    }

    // Créer un nouvel utilisateur
    // Générer un username unique à partir de l'email
    const baseUsername = email.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    while (await this.usersService.findByUsername(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Générer un mot de passe aléatoire (l'utilisateur pourra le changer)
    const randomPassword = randomBytes(32).toString('hex');
    const saltRounds = this.configService.get('bcrypt.saltRounds');
    const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);

    user = await this.usersService.create({
      email,
      password: hashedPassword,
      username,
      firstName: uaePassUserInfo.given_name || uaePassUserInfo.firstName || null,
      lastName: uaePassUserInfo.family_name || uaePassUserInfo.lastName || null,
      uaePassId,
      emailVerified: true, // UAE Pass vérifie déjà l'email
      isActive: true,
    });

    // Mettre à jour lastLogin
    await this.usersService.updateLastLogin(user.id);

    return user;
  }

  /**
   * Valider ou créer un utilisateur depuis OAuth (Google, Facebook, Apple)
   */
  async validateOrCreateOAuthUser(oauthData: {
    provider: 'google' | 'facebook' | 'apple';
    providerId: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  }) {
    const { provider, providerId, email, firstName, lastName } = oauthData;

    if (!providerId || !email) {
      throw new BadRequestException(`Invalid ${provider} user info`);
    }

    // Chercher un utilisateur existant par provider ID
    let user: any = null;
    if (provider === 'google') {
      user = await this.usersService.findByGoogleId(providerId);
    } else if (provider === 'facebook') {
      user = await this.usersService.findByFacebookId(providerId);
    } else if (provider === 'apple') {
      user = await this.usersService.findByAppleId(providerId);
    }

    if (user) {
      // Utilisateur existe déjà, mettre à jour lastLogin
      await this.usersService.updateLastLogin(user.id);
      return user;
    }

    // Chercher par email
    user = await this.usersService.findByEmail(email);

    if (user) {
      // Lier le provider OAuth à l'utilisateur existant
      if (provider === 'google') {
        user.googleId = providerId;
      } else if (provider === 'facebook') {
        user.facebookId = providerId;
      } else if (provider === 'apple') {
        user.appleId = providerId;
      }
      await this.usersService.save(user);
      await this.usersService.updateLastLogin(user.id);
      return user;
    }

    // Créer un nouvel utilisateur
    const baseUsername = email.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    while (await this.usersService.findByUsername(username)) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Générer un mot de passe aléatoire
    const randomPassword = randomBytes(32).toString('hex');
    const saltRounds = this.configService.get('bcrypt.saltRounds');
    const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);

    const userData: any = {
      email,
      password: hashedPassword,
      username,
      firstName: firstName || null,
      lastName: lastName || null,
      emailVerified: true, // OAuth providers vérifient déjà l'email
      isActive: true,
    };

    // Assigner l'ID du provider OAuth
    if (provider === 'google') {
      userData.googleId = providerId;
    } else if (provider === 'facebook') {
      userData.facebookId = providerId;
    } else if (provider === 'apple') {
      userData.appleId = providerId;
    }

    user = await this.usersService.create(userData);
    await this.usersService.updateLastLogin(user.id);

    return user;
  }

  async refreshSession(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('REFRESH_TOKEN_REQUIRED');
    }

    const hashedToken = this.hashToken(refreshToken);
    const user = await this.usersService.findByRefreshTokenHash(hashedToken);

    if (!user || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('REFRESH_TOKEN_INVALID');
    }

    if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
      await this.usersService.clearRefreshToken(user.id);
      throw new UnauthorizedException('REFRESH_TOKEN_EXPIRED');
    }

    return this.buildSessionResponse(user);
  }

  async heartbeat(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('REFRESH_TOKEN_REQUIRED');
    }

    const hashedToken = this.hashToken(refreshToken);
    const user = await this.usersService.findByRefreshTokenHash(hashedToken);

    if (!user || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('REFRESH_TOKEN_INVALID');
    }

    if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
      await this.usersService.clearRefreshToken(user.id);
      throw new UnauthorizedException('REFRESH_TOKEN_EXPIRED');
    }

    // Mettre à jour le lastHeartbeatAt sans générer un nouveau refresh token
    await this.usersService.updateHeartbeat(user.id);

    // Générer un nouvel access token mais garder le même refresh token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);
    const accessExpiresAt = new Date(Date.now() + this.accessTokenTtlMs);

    return {
      access_token,
      refresh_token: refreshToken, // Renvoyer le même refresh token
      expiresAt: accessExpiresAt.toISOString(),
      refreshExpiresAt: user.refreshTokenExpiresAt.toISOString(),
      user: this.mapUserResponse(user),
      session: {
        lastHeartbeatAt: new Date().toISOString(),
        heartbeatIntervalSeconds: this.heartbeatIntervalSeconds,
      },
    };
  }

  async enable2FA(userId: string, method: string) {
    const user = await this.usersService.findOne(userId);

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    // SMS complètement désactivé pour éviter le SIM swapping
    if (method === 'sms') {
      throw new BadRequestException('SMS 2FA is not supported due to SIM swapping vulnerabilities. Please use TOTP (app) or Email instead.');
    }

    let secret: string | null = null;
    let qrCodeUrl: string | null = null;

    if (method === 'app') {
      const secretObj = speakeasy.generateSecret({
        name: `FRAQTAL (${user.email})`,
        length: 32,
      });
      secret = secretObj.base32 || '';

      const otpauthUrl = speakeasy.otpauthURL({
        secret: secret,
        label: user.email,
        issuer: 'FRAQTAL',
        encoding: 'base32',
      });

      qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
    } else if (method === 'email') {
      // Générer un code temporaire pour Email
      const tempCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6 chiffres
      const codeHash = createHash('sha256').update(tempCode).digest('hex');
      const expiresAt = new Date(Date.now() + this.TWO_FA_CODE_EXPIRY_MINUTES * 60 * 1000);

      user.twoFactorTempCode = codeHash;
      user.twoFactorTempCodeExpiresAt = expiresAt;

      // Envoyer le code par email
      await this.send2FAEmailCode(user.email, tempCode);
    } else {
      throw new BadRequestException(`Invalid 2FA method: ${method}. Supported methods are 'app' (TOTP) and 'email'.`);
    }

    user.twoFactorMethod = method;
    user.twoFactorSecret = secret;

    await this.usersService.save(user);

    return {
      method,
      secret: method === 'app' ? secret : null,
      qrCodeUrl: method === 'app' ? qrCodeUrl : null,
      message: method === 'email' ? 'Email verification code sent' : 'Please verify the code to complete 2FA setup',
    };
  }

  /**
   * Envoyer un code 2FA par email
   */
  private async send2FAEmailCode(email: string, code: string) {
    try {
      const subject = 'Your 2FA verification code';
      const html = `
        <p>Your 2FA verification code is: <strong>${code}</strong></p>
        <p>This code expires in ${this.TWO_FA_CODE_EXPIRY_MINUTES} minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
      `;
      await this.emailService.sendMail(email, subject, html);
    } catch (error) {
      this.logger.error(`Failed to send 2FA email code to ${email}:`, error);
    }
  }

  async disable2FA(userId: string) {
    const user = await this.usersService.findOne(userId);

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorMethod = null;

    await this.usersService.save(user);

    return { message: '2FA disabled successfully' };
  }

  async verify2FACode(user: any, code: string, ipAddress?: string): Promise<boolean> {
    if (!user.twoFactorEnabled || !user.twoFactorMethod) {
      return false;
    }

    if (user.twoFactorMethod === 'app') {
      if (!user.twoFactorSecret) {
        return false;
      }

      return speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: code,
        window: 2,
      });
    } else if (user.twoFactorMethod === 'email') {
      // Vérification sécurisée du code email avec protection timing attack
      if (!user.twoFactorTempCode || !user.twoFactorTempCodeExpiresAt) {
        this.logger.warn(`2FA Email code missing for user: ${user.email} from IP: ${ipAddress}`);
        return false;
      }

      if (user.twoFactorTempCodeExpiresAt.getTime() < Date.now()) {
        this.logger.warn(`2FA Email code expired for user: ${user.email} from IP: ${ipAddress}`);
        return false;
      }

      const providedCodeHash = createHash('sha256').update(code).digest('hex');
      const storedCodeHash = user.twoFactorTempCode;

      if (providedCodeHash.length !== storedCodeHash.length) {
        return false;
      }

      try {
        const providedBuffer = Buffer.from(providedCodeHash);
        const storedBuffer = Buffer.from(storedCodeHash);
        const isValid = timingSafeEqual(providedBuffer, storedBuffer);

        if (isValid) {
          // Supprimer le code après utilisation
          user.twoFactorTempCode = null;
          user.twoFactorTempCodeExpiresAt = null;
          await this.usersService.save(user);
        }

        return isValid;
      } catch (error) {
        return false;
      }
    }

    // SMS complètement désactivé
    if (user.twoFactorMethod === 'sms') {
      this.logger.error(`User ${user.email} has SMS 2FA enabled (should not be possible). Please disable and re-enable with a secure method.`);
      return false;
    }

    return false;
  }

  async verifyAndEnable2FA(userId: string, code: string) {
    const user = await this.usersService.findOne(userId);

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('2FA secret not found. Please enable 2FA first.');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    user.twoFactorEnabled = true;
    user.twoFactorMethod = 'app';
    await this.usersService.save(user);

    return { message: '2FA enabled successfully' };
  }

  /**
   * Envoyer un OTP par email pour login/signup unifié
   * Si l'utilisateur n'existe pas, il sera créé automatiquement
   */
  async sendOTP(email: string, ipAddress?: string): Promise<{ message: string }> {
    // Vérifier si l'utilisateur existe
    let user = await this.usersService.findByEmail(email);

    if (user && user.emailVerified && user.isActive === false) {
      this.logger.warn(`OTP request blocked for disabled account: ${email} from IP: ${ipAddress}`);
      throw new ForbiddenException('ACCOUNT_DISABLED');
    }

    // Si l'utilisateur n'existe pas, créer un compte basique
    if (!user) {
      // Générer un username unique basé sur l'email
      const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let counter = 1;

      while (await this.usersService.findByUsername(username)) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      // Créer un mot de passe temporaire (sera remplacé par l'OTP)
      const tempPassword = randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      // Créer l'utilisateur avec create() puis activer le compte
      user = await this.usersService.create({
        email,
        password: hashedPassword,
        username,
        firstName: null,
        lastName: null,
        dateOfBirth: null,
        country: null,
        role: UserRole.CLIENT,
      });

      // Activer le compte (create() met isActive: false par défaut)
      user.isActive = true;
      await this.usersService.save(user);

      this.logger.log(`New user created via OTP flow: ${email} from IP: ${ipAddress}`);
    }

    // Générer un code OTP à 6 chiffres
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hasher le code OTP avant de le stocker
    const hashedOtp = createHash('sha256').update(otpCode).digest('hex');

    // Stocker le code hashé et sa date d'expiration (10 minutes)
    user.otpCode = hashedOtp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await this.usersService.save(user);

    // Envoyer l'OTP par email avec un template minimaliste
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your verification code</title>

<!-- Dark-mode support meta -->
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">

</head>
<body style="
 margin:0;
 padding:0;
 font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
 color-scheme: light dark;
 forced-color-adjust:none;
">

<table role="presentation" style="width:100%; border-collapse:collapse; margin:0; padding:0;">
  <tr>
    <td style="padding:20px;">

      <table role="presentation" style="width:100%; max-width:600px; margin:0 auto; border-collapse:collapse;">

        <!-- Title -->
        <tr>
          <td style="text-align:left; padding:0 0 6px;">
            <h1 style="
              margin:0;
              font-size:24px;
              font-weight:bold;
              color:#000000;
            ">
              Your verification code
            </h1>
          </td>
        </tr>

        <!-- Subtitle -->
        <tr>
          <td style="text-align:left; padding:0 0 20px;">
            <p style="
              margin:0;
              font-size:14px;
              color:#9b9b9b;
              line-height:1.5;
              font-weight:normal;
              forced-color-adjust:none;
            ">
              Use the one-time code below to continue.
            </p>
          </td>
        </tr>

        <!-- OTP Block (dark gray full width) -->
        <tr>
          <td style="padding:0 0 20px;">
            <div style="
              width:100%;
              background:#2c2c2c;
              text-align:center;
              padding:15px 0;
              border-radius: 10px;
              forced-color-adjust:none;
            ">
              <p style="
                margin:0;
                font-size:25px;
                color:#FFFFFF;
                font-weight:600;
                letter-spacing:0.15em;
                -webkit-text-fill-color:#FFFFFF;
                forced-color-adjust:none;
              ">
                ${otpCode}
              </p>
            </div>
          </td>
        </tr>

        <!-- Info -->
        <tr>
          <td style="text-align:left; padding:0 0 25px;">
            <p style="
              margin:0;
              font-size:12px;
              color:#9b9b9b;
              line-height:1.5;
              font-weight:normal;
              forced-color-adjust:none;
            ">
              This code will expire in 10 minutes and can only be used once. For your security, do not share this code with anyone.
            </p>
          </td>
        </tr>

        <!-- Logo RECCOS -->
        <tr>
          <td style="text-align:center; padding-top:10px;">
            <h2 style="
              margin:0;
              font-size:36px;
              text-transform:uppercase;
              font-family:'Bebas Neue', sans-serif;
              letter-spacing:0.08em;
              font-weight:normal;
              background: linear-gradient(to right, #FFFFFF, #656565 50%, #FFFFFF);
              -webkit-background-clip:text;
              -webkit-text-fill-color:transparent;
              background-clip:text;
              forced-color-adjust:none;
            ">
              RECCOS
            </h2>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>

    `;

    const textContent = `Your verification code: ${otpCode}\n\nUse the one-time code below to continue.\n\nThis code will expire in 10 minutes and can only be used once. For your security, do not share this code with anyone.\n\nRECCOS`;

    await this.emailService.sendMail(
      email,
      'Your OTP Code - RECCOS',
      htmlContent,
      textContent,
    );

    this.logger.log(`OTP sent to ${email} from IP: ${ipAddress}`);

    return { message: 'OTP code sent to email' };
  }

  /**
   * Vérifier l'OTP et connecter l'utilisateur (ou créer le compte si nouveau)
   */
  async verifyOTP(email: string, code: string, ipAddress?: string): Promise<{
    access_token: string;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      username: string;
      role: UserRole;
      emailVerified: boolean;
      isActive: boolean;
    };
  }> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    // Si le compte a déjà été vérifié mais a été désactivé (ex: par un admin), bloquer l'accès
    if (!user.isActive && user.emailVerified) {
      throw new ForbiddenException('ACCOUNT_DISABLED');
    }

    // Vérifier si le code OTP existe et n'est pas expiré
    if (!user.otpCode || !user.otpExpiresAt) {
      throw new UnauthorizedException('No OTP code found. Please request a new one.');
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      // Code expiré, nettoyer
      user.otpCode = null;
      user.otpExpiresAt = null;
      await this.usersService.save(user);
      throw new UnauthorizedException('OTP code expired. Please request a new one.');
    }

    // Vérifier le code OTP
    const hashedCode = createHash('sha256').update(code).digest('hex');
    if (user.otpCode !== hashedCode) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    const wasEmailVerified = !!user.emailVerified;

    // Code valide : nettoyer l'OTP et activer le compte
    user.otpCode = null;
    user.otpExpiresAt = null;
    user.emailVerified = true; // L'email est vérifié via l'OTP
    // N'activer le compte que s'il ne l'était pas encore (première vérification)
    if (!wasEmailVerified) {
      user.isActive = true;
    }
    user.lastLoginAt = new Date();
    await this.usersService.save(user);

    this.logger.log(`User logged in via OTP: ${email} from IP: ${ipAddress}`);

    return this.buildSessionResponse(user);
  }
}
