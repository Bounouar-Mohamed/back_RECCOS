import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole, DEFAULT_USER_ROLE } from '../../common/enums/user-role.enum';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
@Index('IDX_users_refresh_token_hash', ['refreshTokenHash'])
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 50 })
  username: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  emailVerificationToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationTokenExpiresAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role_enum', // Nom explicite pour correspondre à la migration
    default: DEFAULT_USER_ROLE,
  })
  role: UserRole;

  /**
   * Token pour la réinitialisation du mot de passe
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  passwordResetToken: string | null;

  /**
   * Date d'expiration du token de réinitialisation
   */
  @Column({ type: 'timestamp', nullable: true })
  passwordResetTokenExpiresAt: Date | null;

  /**
   * ID UAE Pass (si l'utilisateur s'est connecté via UAE Pass)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  uaePassId: string | null;

  /**
   * ID Google (si l'utilisateur s'est connecté via Google)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  googleId: string | null;

  /**
   * ID Facebook (si l'utilisateur s'est connecté via Facebook)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  facebookId: string | null;

  /**
   * ID Apple (si l'utilisateur s'est connecté via Apple)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  appleId: string | null;

  // ========== 2FA (Double Authentification) ==========
  /**
   * 2FA activée ou non
   */
  @Column({ type: 'boolean', default: false })
  twoFactorEnabled: boolean;

  /**
   * Secret TOTP pour l'authentification par application (Google Authenticator, etc.)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  twoFactorSecret: string | null;

  /**
   * Méthode 2FA : 'app' (TOTP) ou 'email'
   * Note: SMS désactivé pour éviter le SIM swapping
   */
  @Column({ type: 'varchar', length: 20, nullable: true })
  twoFactorMethod: string | null;

  /**
   * Numéro de téléphone (pour d'autres usages, pas pour 2FA)
   * Note: Ne plus utiliser pour 2FA SMS (désactivé)
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  phoneNumber: string | null;

  /**
   * Téléphone vérifié ou non (pour d'autres usages, pas pour 2FA)
   */
  @Column({ type: 'boolean', default: false })
  phoneVerified: boolean;

  // ========== SÉCURITÉ (Protection brute force) ==========
  /**
   * Nombre de tentatives de login échouées
   */
  @Column({ type: 'integer', default: 0 })
  failedLoginAttempts: number;

  /**
   * Date de verrouillage du compte (si trop de tentatives échouées)
   */
  @Column({ type: 'timestamp', nullable: true })
  accountLockedUntil: Date | null;

  /**
   * Codes 2FA SMS/Email temporaires (hashés)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  twoFactorTempCode: string | null;

  /**
   * Expiration du code 2FA temporaire
   */
  @Column({ type: 'timestamp', nullable: true })
  twoFactorTempCodeExpiresAt: Date | null;

  /**
   * Nombre de tentatives 2FA échouées
   */
  @Column({ type: 'integer', default: 0 })
  failed2FAAttempts: number;

  /**
   * Tokens de reset password utilisés (pour éviter la réutilisation)
   */
  @Column({ type: 'jsonb', nullable: true })
  usedResetTokens: string[] | null;

  // ========== OTP (One-Time Password pour login/signup unifié) ==========
  /**
   * Code OTP pour login/signup (hashé)
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  otpCode: string | null;

  /**
   * Date d'expiration du code OTP (10 minutes)
   */
  @Column({ type: 'timestamp', nullable: true })
  otpExpiresAt: Date | null;

  /**
   * Hash du refresh token courant
   */
  @Column({ type: 'varchar', length: 512, nullable: true })
  refreshTokenHash: string | null;

  /**
   * Expiration du refresh token
   */
  @Column({ type: 'timestamp', nullable: true })
  refreshTokenExpiresAt: Date | null;

  /**
   * Dernier heartbeat reçu, utilisé pour maintenir la session ouverte
   */
  @Column({ type: 'timestamp', nullable: true })
  lastHeartbeatAt: Date | null;
}
