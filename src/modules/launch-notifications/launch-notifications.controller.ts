import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { LaunchNotificationsService } from './launch-notifications.service';
import { SubscribeLaunchDto } from './dto/subscribe-launch.dto';

@ApiTags('launch-notifications')
@Controller('launch-notifications')
export class LaunchNotificationsController {
  constructor(private readonly launchNotificationsService: LaunchNotificationsService) {}

  /**
   * S'inscrire pour recevoir une notification de lancement (public)
   */
  @Post('subscribe')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Subscribe to a property launch notification' })
  @ApiResponse({ status: 200, description: 'Successfully subscribed' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  @ApiResponse({ status: 409, description: 'Already subscribed' })
  async subscribe(@Body() dto: SubscribeLaunchDto) {
    return this.launchNotificationsService.subscribe(dto);
  }
}


