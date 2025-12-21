import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { createHmac } from 'crypto';
import { CreateEphemeralTokenDto } from './dto/create-ephemeral-token.dto';

interface CurrentUserPayload {
  id: string;
  email: string;
  role?: string;
}

export interface EphemeralTokenResponse {
  token: string;
  expires_in?: number;
  sessionId?: string;
  assistant_thread_id?: string;
}

@Injectable()
export class RealtimeGatewayService {
  private readonly logger = new Logger(RealtimeGatewayService.name);
  private readonly client: AxiosInstance;
  private readonly internalKey: string;
  private readonly userContextSecret: string;

  constructor(private readonly configService: ConfigService) {
    const baseUrl =
      this.configService.get<string>('quantix.baseUrl') ||
      process.env.QUANTIX_BASE_URL ||
      'http://localhost:3001/api/v1';

    this.internalKey =
      this.configService.get<string>('quantix.internalKey') ||
      process.env.QUANTIX_INTERNAL_KEY ||
      '';

    this.userContextSecret =
      this.configService.get<string>('quantix.userContextSecret') ||
      process.env.USER_CONTEXT_SECRET ||
      '';

    if (!this.internalKey) {
      throw new InternalServerErrorException('QUANTIX_INTERNAL_KEY manquante');
    }

    if (!this.userContextSecret) {
      throw new InternalServerErrorException('USER_CONTEXT_SECRET manquante');
    }

    this.client = axios.create({
      baseURL: baseUrl.replace(/\/$/, ''),
      timeout: 30000,
    });

    this.logger.log(`RealtimeGatewayService initialized with baseUrl: ${baseUrl}`);
  }

  /**
   * Crée un token éphémère pour la session Realtime WebRTC
   */
  async createEphemeralToken(
    user: CurrentUserPayload | null | undefined,
    dto: CreateEphemeralTokenDto,
    ip: string,
    userAgent?: string,
  ): Promise<EphemeralTokenResponse> {
    const isAuthenticated = !!user?.id;

    // ═══════════════════════════════════════════════════════════════════════════════
    // IMPORTANT: tenantId = identifiant du CLIENT (ex: "reccos"), PAS l'utilisateur
    // Cela permet de tracker la consommation par client dans Quantix
    // ═══════════════════════════════════════════════════════════════════════════════
    const CLIENT_TENANT_ID = process.env.TENANT_ID || 'reccos';

    let userId: string;
    const tenantId = CLIENT_TENANT_ID; // Toujours utiliser l'identifiant du client

    if (isAuthenticated) {
      userId = user.id;
    } else {
      // Utilisateur anonyme
      const sessionId = `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      userId = dto.userId || sessionId;
    }

    // Ne pas inclure ip et userAgent dans le payload envoyé à Quantix
    // car le DTO de Quantix ne les accepte pas
    const payload = {
      userId,
      tenantId,
      conversationId: dto.conversationId,
    };

    const headers = this.buildHeaders({
      userId,
      tenantId,
      roles: user?.role ? [user.role] : [],
    });

    try {
      this.logger.debug(`Creating ephemeral token for user ${userId}`);
      
      const response = await this.client.post<EphemeralTokenResponse>(
        '/chatbot/realtime/ephemeral-token',
        payload,
        { headers },
      );

      this.logger.debug(`Ephemeral token created successfully`);
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Quantix realtime service unreachable';
      
      this.logger.error(`Quantix realtime error: ${status || 'n/a'} - ${message}`, {
        error: error?.response?.data,
      });
      
      throw new BadGatewayException(message);
    }
  }

  /**
   * Récupère la configuration Realtime
   */
  async getConfig(userId?: string, tenantId?: string): Promise<any> {
    const CLIENT_TENANT_ID = process.env.TENANT_ID || 'reccos';
    const headers = this.buildHeaders({
      userId: userId || 'anonymous',
      tenantId: tenantId || CLIENT_TENANT_ID,
      roles: [],
    });

    try {
      const response = await this.client.get('/chatbot/realtime/config', { headers });
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Error fetching config';
      throw new BadGatewayException(message);
    }
  }

  /**
   * Révoque un token/session
   */
  async revokeToken(sessionId: string, userId: string): Promise<{ success: boolean }> {
    const CLIENT_TENANT_ID = process.env.TENANT_ID || 'reccos';
    const headers = this.buildHeaders({
      userId,
      tenantId: CLIENT_TENANT_ID,
      roles: [],
    });

    try {
      const response = await this.client.post(
        '/chatbot/realtime/revoke',
        { sessionId, userId },
        { headers },
      );
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Error revoking token';
      throw new BadGatewayException(message);
    }
  }

  /**
   * Exécute un tool appelé par le modèle Realtime
   */
  async executeTool(dto: {
    name: string;
    arguments: any;
    sessionId?: string;
    userId: string;
    correlationId?: string;
  }): Promise<any> {
    const CLIENT_TENANT_ID = process.env.TENANT_ID || 'reccos';
    const headers = this.buildHeaders({
      userId: dto.userId,
      tenantId: CLIENT_TENANT_ID,
      roles: [],
    });

    try {
      this.logger.debug(`Executing tool ${dto.name} for user ${dto.userId}`);
      
      const response = await this.client.post(
        '/chatbot/realtime/tools/execute',
        {
          name: dto.name,
          arguments: dto.arguments,
          sessionId: dto.sessionId || `sess_${Date.now()}`,
          userId: dto.userId,
          correlationId: dto.correlationId || `corr_${Date.now()}`,
        },
        { headers },
      );
      
      this.logger.debug(`Tool ${dto.name} executed successfully`);
      return response.data;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Error executing tool';
      this.logger.error(`Tool execution error: ${message}`);
      throw new BadGatewayException(message);
    }
  }

  private buildHeaders(params: {
    userId: string;
    tenantId: string;
    roles: string[];
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

    return {
      'x-internal-key': this.internalKey,
      'tenant-id': params.tenantId,
      'user-id': params.userId,
      'x-user-context': encodedContext,
      'x-user-context-signature': signature,
    };
  }
}

