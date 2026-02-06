import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';
import { AiChatDto } from './dto/ai-chat.dto';
import { AiConversationsService, ConversationSummary, ConversationDetails } from '../ai-conversations/ai-conversations.service';

type CurrentUserPayload = {
  id: string;
  email: string;
  role?: string;
};

@Injectable()
export class AiGatewayService {
  private readonly logger = new Logger(AiGatewayService.name);
  private readonly client: AxiosInstance;
  private readonly internalKey: string;
  private readonly userContextSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly aiConversationsService: AiConversationsService,
  ) {
    const baseUrl =
      this.configService.get<string>('quantix.baseUrl') ||
      process.env.QUANTIX_BASE_URL ||
      'http://localhost:3001/api/v1';

    // SECURITY: Use tenant-specific API key (new system) or fallback to legacy
    this.internalKey =
      process.env.QUANTIX_API_KEY ||
      this.configService.get<string>('quantix.apiKey') ||
      process.env.QUANTIX_INTERNAL_KEY ||
      this.configService.get<string>('quantix.internalKey') ||
      '';

    this.userContextSecret =
      this.configService.get<string>('quantix.userContextSecret') ||
      process.env.USER_CONTEXT_SECRET ||
      '';

    if (!this.internalKey) {
      throw new InternalServerErrorException('QUANTIX_API_KEY manquante');
    }

    if (!this.userContextSecret) {
      throw new InternalServerErrorException('USER_CONTEXT_SECRET manquante');
    }

    this.client = axios.create({
      baseURL: baseUrl.replace(/\/$/, ''),
      timeout: 60000, // 60s pour les Assistants API avec function calls
    });
  }

  async generateResponse(user: CurrentUserPayload | null | undefined, dto: AiChatDto) {
    // Gérer les utilisateurs authentifiés vs anonymes
    const isAuthenticated = !!user?.id;
    
    // ═══════════════════════════════════════════════════════════════════════════════
    // IMPORTANT: tenantId = identifiant du CLIENT (ex: "reccos"), PAS l'utilisateur
    // Cela permet de tracker la consommation par client dans Quantix
    // ═══════════════════════════════════════════════════════════════════════════════
    const CLIENT_TENANT_ID = process.env.TENANT_ID || 'reccos';
    
    let userId: string;
    let conversationId: string;
    const tenantId = CLIENT_TENANT_ID; // Toujours utiliser l'identifiant du client
    
    if (isAuthenticated) {
      // Utilisateur authentifié
      userId = user.id;
      conversationId = dto.conversationId || `conv_${userId}_${Date.now()}`;
    } else {
      // Utilisateur anonyme - utiliser un ID stable basé sur le conversationId
      if (dto.conversationId) {
        conversationId = dto.conversationId;
        userId = `anon_${conversationId}`;
      } else {
        // Nouvelle conversation anonyme
        const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        conversationId = `conv_${sessionId}_${Date.now()}`;
        userId = sessionId;
      }
    }

    // Extraire useAssistants du DTO - il sera envoyé en header, pas dans le body
    const { useAssistants, ...dtoWithoutAssistants } = dto;

    const payload = {
      ...dtoWithoutAssistants,
      conversationId,
      tenantId,
    };

    const headers = this.buildHeaders({
      userId,
      tenantId,
      roles: user?.role ? [user.role] : [],
      conversationId,
      useAssistants,
    });

    try {
      const response = await this.client.post('/ai/generate', payload, {
        headers,
      });

      // Sauvegarder la conversation dans la base de données
      const lastUserMessage = dto.messages[dto.messages.length - 1];
      const aiResponse = response.data?.content || response.data?.response || '';

      // Synchroniser les messages de manière asynchrone (ne pas bloquer la réponse)
      // Ne sauvegarder que si l'utilisateur est authentifié
      if (user) {
        this.saveConversation(
          conversationId,
          userId,
          tenantId,
          lastUserMessage?.content || '',
          aiResponse,
          response.data?.model,
          response.data?.usage,
        ).catch((err) => {
          this.logger.warn(`Erreur lors de la sauvegarde de la conversation: ${err.message}`);
        });
      }

      return {
        conversationId,
        tenantId,
        ...response.data,
      };
    } catch (error: any) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Quantix unreachable';
      this.logger.warn(`Quantix error: ${status || 'n/a'} - ${message}`);
      throw new BadGatewayException(message);
    }
  }

  /**
   * Sauvegarde les messages d'une conversation
   */
  private async saveConversation(
    conversationId: string,
    userId: string,
    tenantId: string,
    userMessage: string,
    aiResponse: string,
    model?: string,
    usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number },
  ): Promise<void> {
    const messages = [];

    if (userMessage) {
      messages.push({
        role: 'user' as const,
        content: userMessage,
        timestamp: new Date().toISOString(),
      });
    }

    if (aiResponse) {
      messages.push({
        role: 'assistant' as const,
        content: aiResponse,
        model,
        promptTokens: usage?.promptTokens,
        completionTokens: usage?.completionTokens,
        totalTokens: usage?.totalTokens,
        timestamp: new Date().toISOString(),
      });
    }

    if (messages.length > 0) {
      await this.aiConversationsService.appendMessages(conversationId, {
        userId,
        tenantId,
        messages,
        metadata: { model },
      });
      this.logger.debug(`Conversation ${conversationId} sauvegardée avec ${messages.length} messages`);
    }
  }

  private buildHeaders(params: {
    userId: string;
    tenantId: string;
    roles: string[];
    conversationId: string;
    useAssistants?: boolean;
  }) {
    const contextPayload = {
      userId: params.userId,
      tenantId: params.tenantId,
      roles: params.roles,
      permissions: [],
    };
    const encodedContext = Buffer.from(
      JSON.stringify(contextPayload),
    ).toString('base64');
    const signature = createHmac('sha256', this.userContextSecret)
      .update(encodedContext)
      .digest('hex');

    const headers: Record<string, string> = {
      // SECURITY: Use x-api-key for tenant-specific authentication
      'x-api-key': this.internalKey,
      // Explicit profile declaration (Reccos = noor only)
      'x-ai-profile': 'noor',
      'conversation-id': params.conversationId,
      'tenant-id': params.tenantId,
      'x-user-context': encodedContext,
      'x-user-context-signature': signature,
    };

    if (typeof params.useAssistants === 'boolean') {
      headers['x-use-assistants'] = params.useAssistants ? 'true' : 'false';
    }

    return headers;
  }

  /**
   * Récupère l'historique des conversations d'un utilisateur
   */
  async getConversations(userId: string): Promise<ConversationSummary[]> {
    return this.aiConversationsService.getConversationsByUserId(userId);
  }

  /**
   * Récupère les détails d'une conversation
   */
  async getConversation(conversationId: string, userId: string): Promise<ConversationDetails> {
    return this.aiConversationsService.getConversationDetails(conversationId, userId);
  }

  /**
   * Supprime une conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<{ success: boolean }> {
    return this.aiConversationsService.deleteConversation(conversationId, userId);
  }
}

