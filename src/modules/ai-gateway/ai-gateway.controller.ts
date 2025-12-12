import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AiGatewayService } from './ai-gateway.service';
import { AiChatDto } from './dto/ai-chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiGatewayController {
  constructor(private readonly aiGatewayService: AiGatewayService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Discuter avec Quantix' })
  @ApiResponse({ status: 201, description: 'Réponse IA' })
  async chat(@Body() body: AiChatDto, @CurrentUser() user: any) {
    return this.aiGatewayService.generateResponse(user, body);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Récupérer l\'historique des conversations' })
  @ApiResponse({ status: 200, description: 'Liste des conversations' })
  async getConversations(@CurrentUser() user: any) {
    return this.aiGatewayService.getConversations(user.id);
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Récupérer une conversation spécifique' })
  @ApiResponse({ status: 200, description: 'Détails de la conversation' })
  async getConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ) {
    return this.aiGatewayService.getConversation(conversationId, user.id);
  }

  @Delete('conversations/:conversationId')
  @ApiOperation({ summary: 'Supprimer une conversation' })
  @ApiResponse({ status: 200, description: 'Conversation supprimée' })
  async deleteConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ) {
    return this.aiGatewayService.deleteConversation(conversationId, user.id);
  }
}

