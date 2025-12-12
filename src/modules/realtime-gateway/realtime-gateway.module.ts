import { Module } from '@nestjs/common';
import { RealtimeGatewayController } from './realtime-gateway.controller';
import { RealtimeGatewayService } from './realtime-gateway.service';

@Module({
  controllers: [RealtimeGatewayController],
  providers: [RealtimeGatewayService],
  exports: [RealtimeGatewayService],
})
export class RealtimeGatewayModule {}

