import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiConversationsService } from './ai-conversations.service';
import { SyncConversationDto } from './dto/sync-conversation.dto';
import { InternalKeyGuard } from '../../common/guards/internal-key.guard';

@ApiTags('internal-ai-conversations')
@Controller('internal/ai/conversations')
@UseGuards(InternalKeyGuard)
export class AiConversationsController {
  constructor(private readonly conversationsService: AiConversationsService) {}

  @Post(':conversationId/messages')
  @ApiOperation({
    summary: 'Synchroniser les messages d’une conversation IA (Quantix -> backend)',
  })
  @ApiResponse({ status: 200, description: 'Conversation synchronisée' })
  async syncMessages(
    @Param('conversationId') conversationId: string,
    @Body() body: SyncConversationDto,
  ) {
    return this.conversationsService.appendMessages(conversationId, body);
  }
}

