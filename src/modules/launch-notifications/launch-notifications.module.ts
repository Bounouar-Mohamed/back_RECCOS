import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { LaunchNotification } from '../../database/entities/launch-notification.entity';
import { Property } from '../../database/entities/property.entity';
import { LaunchNotificationsService } from './launch-notifications.service';
import { LaunchNotificationsController } from './launch-notifications.controller';
import { EmailService } from '../../common/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LaunchNotification, Property]),
    ScheduleModule.forRoot(),
  ],
  controllers: [LaunchNotificationsController],
  providers: [LaunchNotificationsService, EmailService],
  exports: [LaunchNotificationsService],
})
export class LaunchNotificationsModule {}


