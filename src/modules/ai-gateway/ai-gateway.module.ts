import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiGatewayController } from './ai-gateway.controller';
import { AiGatewayService } from './ai-gateway.service';
import { AiConversationsModule } from '../ai-conversations/ai-conversations.module';

@Module({
  imports: [ConfigModule, AiConversationsModule],
  controllers: [AiGatewayController],
  providers: [AiGatewayService],
})
export class AiGatewayModule {}

