import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TwoFactorMethod {
  APP = 'app', // TOTP (Google Authenticator, Authy, etc.) - RECOMMANDÉ
  EMAIL = 'email', // Email 2FA
  // SMS complètement désactivé pour éviter le SIM swapping
}

export class Enable2FADto {
  @ApiProperty({
    description: '2FA method (TOTP or Email only - SMS disabled for security)',
    enum: TwoFactorMethod,
    example: TwoFactorMethod.APP,
    enumName: 'TwoFactorMethod',
  })
  @IsEnum(TwoFactorMethod)
  @IsNotEmpty()
  method: TwoFactorMethod;
}

