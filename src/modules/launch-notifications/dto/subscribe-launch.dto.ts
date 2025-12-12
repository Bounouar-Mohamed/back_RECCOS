import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { NotificationTiming } from '../../../database/entities/launch-notification.entity';

export class SubscribeLaunchDto {
  @IsEmail()
  email: string;

  @IsUUID()
  propertyId: string;

  @IsEnum(NotificationTiming)
  @IsOptional()
  timing?: NotificationTiming;

  @IsString()
  @IsOptional()
  locale?: string;
}


