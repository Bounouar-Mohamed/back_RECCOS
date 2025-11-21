import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsDateString, Matches } from 'class-validator';
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

/**
 * Validateur personnalisé pour la force du mot de passe
 * Doit contenir : majuscule, minuscule, chiffre, caractère spécial, min 8 caractères
 */
function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
          const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/])[A-Za-z\d@$!%*?&#^()_+\-=\[\]{};':"\\|,.<>\/]{8,}$/;
          return strongPasswordRegex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character';
        },
      },
    });
  };
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsStrongPassword()
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  // Username: 3-30 chars, letters, numbers, underscores, dots, hyphens
  @Matches(/^[a-zA-Z0-9._-]{3,30}$/, {
    message:
      'Username must be 3-30 characters and contain only letters, numbers, dots, underscores or hyphens',
  })
  username: string;

  @IsDateString({}, { message: 'dateOfBirth must be an ISO 8601 date string' })
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}
