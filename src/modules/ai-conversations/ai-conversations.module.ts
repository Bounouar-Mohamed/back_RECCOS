import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiConversationEntity } from '../../database/entities/ai-conversation.entity';
import { AiMessageEntity } from '../../database/entities/ai-message.entity';
import { AiConversationsController } from './ai-conversations.controller';
import { AiConversationsService } from './ai-conversations.service';

@Module({
  imports: [TypeOrmModule.forFeature([AiConversationEntity, AiMessageEntity])],
  controllers: [AiConversationsController],
  providers: [AiConversationsService],
  exports: [AiConversationsService],
})
export class AiConversationsModule {}

