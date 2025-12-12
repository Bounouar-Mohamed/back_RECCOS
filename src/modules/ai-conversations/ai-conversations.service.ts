import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiConversationEntity } from '../../database/entities/ai-conversation.entity';
import { AiMessageEntity } from '../../database/entities/ai-message.entity';
import { SyncConversationDto, SyncConversationMessageDto } from './dto/sync-conversation.dto';

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface ConversationDetails {
  id: string;
  title: string;
  messages: { role: string; content: string }[];
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AiConversationsService {
  private readonly logger = new Logger(AiConversationsService.name);

  constructor(
    @InjectRepository(AiConversationEntity)
    private readonly conversationRepository: Repository<AiConversationEntity>,
    @InjectRepository(AiMessageEntity)
    private readonly messageRepository: Repository<AiMessageEntity>,
  ) {}

  async appendMessages(conversationId: string, dto: SyncConversationDto) {
    let conversation = await this.conversationRepository.findOne({
      where: { conversationId },
    });

    if (!conversation) {
      conversation = this.conversationRepository.create({
        conversationId,
        userId: dto.userId,
        tenantId: dto.tenantId,
        assistantThreadId: dto.assistantThreadId,
        lastModel: dto.metadata?.model,
        metadata: dto.metadata,
      });
    } else {
      conversation.userId = dto.userId;
      conversation.tenantId = dto.tenantId ?? conversation.tenantId;
      conversation.assistantThreadId = dto.assistantThreadId ?? conversation.assistantThreadId;
      conversation.lastModel = dto.metadata?.model ?? conversation.lastModel;
      conversation.metadata = dto.metadata ?? conversation.metadata;
    }

    conversation.lastActivityAt = new Date();
    await this.conversationRepository.save(conversation);

    if (dto.messages?.length) {
      const records = dto.messages.map((message) => this.createMessageEntity(conversation, message));
      await this.messageRepository.save(records);
    }

    return {
      conversationId: conversation.conversationId,
      messagesStored: dto.messages?.length ?? 0,
    };
  }

  private createMessageEntity(
    conversation: AiConversationEntity,
    message: SyncConversationMessageDto,
  ): AiMessageEntity {
    return this.messageRepository.create({
      conversation,
      role: message.role,
      content: message.content,
      model: message.model,
      promptTokens: message.promptTokens,
      completionTokens: message.completionTokens,
      totalTokens:
        message.totalTokens ??
        (((message.promptTokens ?? 0) + (message.completionTokens ?? 0)) || undefined),
      durationMs: message.durationMs,
      metadata: message.metadata,
      messageTimestamp: message.timestamp ? new Date(message.timestamp) : new Date(),
    });
  }

  /**
   * Récupère la liste des conversations d'un utilisateur
   */
  async getConversationsByUserId(userId: string): Promise<ConversationSummary[]> {
    const conversations = await this.conversationRepository.find({
      where: { userId },
      order: { lastActivityAt: 'DESC' },
      take: 50, // Limiter à 50 conversations
    });

    const summaries: ConversationSummary[] = [];

    for (const conv of conversations) {
      // Récupérer le dernier message et le nombre de messages
      const [lastMessage, messageCount] = await Promise.all([
        this.messageRepository.findOne({
          where: { conversation: { id: conv.id } },
          order: { messageTimestamp: 'DESC' },
        }),
        this.messageRepository.count({
          where: { conversation: { id: conv.id } },
        }),
      ]);

      // Générer un titre à partir du premier message utilisateur
      const firstUserMessage = await this.messageRepository.findOne({
        where: { conversation: { id: conv.id }, role: 'user' },
        order: { messageTimestamp: 'ASC' },
      });

      const title = firstUserMessage?.content?.slice(0, 50) || 'Nouvelle conversation';

      summaries.push({
        id: conv.conversationId,
        title: title.length >= 50 ? `${title}...` : title,
        lastMessage: lastMessage?.content?.slice(0, 100),
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.lastActivityAt?.toISOString() || conv.updatedAt.toISOString(),
        messageCount,
      });
    }

    return summaries;
  }

  /**
   * Récupère les détails d'une conversation avec tous ses messages
   */
  async getConversationDetails(conversationId: string, userId: string): Promise<ConversationDetails> {
    const conversation = await this.conversationRepository.findOne({
      where: { conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    const messages = await this.messageRepository.find({
      where: { conversation: { id: conversation.id } },
      order: { messageTimestamp: 'ASC' },
    });

    // Générer un titre
    const firstUserMessage = messages.find(m => m.role === 'user');
    const title = firstUserMessage?.content?.slice(0, 50) || 'Conversation';

    return {
      id: conversation.conversationId,
      title: title.length >= 50 ? `${title}...` : title,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.lastActivityAt?.toISOString() || conversation.updatedAt.toISOString(),
    };
  }

  /**
   * Supprime une conversation et tous ses messages
   */
  async deleteConversation(conversationId: string, userId: string): Promise<{ success: boolean }> {
    const conversation = await this.conversationRepository.findOne({
      where: { conversationId, userId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    // Supprimer d'abord les messages (relation cascade)
    await this.messageRepository.delete({ conversation: { id: conversation.id } });
    
    // Puis supprimer la conversation
    await this.conversationRepository.delete({ id: conversation.id });

    this.logger.log(`Conversation ${conversationId} supprimée pour utilisateur ${userId}`);

    return { success: true };
  }
}

