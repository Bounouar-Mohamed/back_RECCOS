import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginWith2FADto {
  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'SecurePassword123!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: '2FA verification code (required if 2FA is enabled)',
    example: '123456',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Length(6, 6, { message: 'Code must be 6 digits' })
  twoFactorCode?: string;
}
















