import {
  Body,
  Controller,
  Get,
  Headers,
  Ip,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RealtimeGatewayService, EphemeralTokenResponse } from './realtime-gateway.service';
import { CreateEphemeralTokenDto } from './dto/create-ephemeral-token.dto';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('realtime')
@Controller('chatbot/realtime')
export class RealtimeGatewayController {
  constructor(private readonly realtimeGatewayService: RealtimeGatewayService) {}

  @Post('ephemeral-token')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Créer un token éphémère pour session Realtime WebRTC',
    description:
      'Génère un token JWT éphémère pour authentification WebRTC avec OpenAI Realtime API',
  })
  @ApiResponse({ status: 200, description: 'Token créé avec succès' })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  @ApiResponse({ status: 502, description: 'Service Quantix indisponible' })
  async createEphemeralToken(
    @Body() dto: CreateEphemeralTokenDto,
    @CurrentUser() user: any,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ): Promise<EphemeralTokenResponse> {
    return this.realtimeGatewayService.createEphemeralToken(user, dto, ip, userAgent);
  }

  @Get('config')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Obtenir la configuration Realtime',
    description: 'Retourne les policies, modèle, voix, instructions système',
  })
  @ApiResponse({ status: 200, description: 'Configuration récupérée' })
  async getConfig(
    @CurrentUser() user: any,
    @Headers('tenant-id') tenantId?: string,
  ) {
    return this.realtimeGatewayService.getConfig(user?.id, tenantId);
  }

  @Post('revoke')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Révoquer un token/session',
    description: 'Met fin à une session Realtime en révoquant le token',
  })
  @ApiResponse({ status: 200, description: 'Token révoqué' })
  async revokeToken(
    @Body() dto: { sessionId: string },
    @CurrentUser() user: any,
  ) {
    return this.realtimeGatewayService.revokeToken(dto.sessionId, user?.id || 'anonymous');
  }

  @Post('tools/execute')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Exécuter un tool appelé par le modèle',
    description: 'Bridge entre le modèle Realtime et les outils backend (list_available_properties, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Tool exécuté' })
  @ApiResponse({ status: 400, description: 'Tool non autorisé ou arguments invalides' })
  async executeTool(
    @Body() dto: { name: string; arguments: any; sessionId?: string; userId?: string; correlationId?: string },
    @CurrentUser() user: any,
  ) {
    return this.realtimeGatewayService.executeTool({
      name: dto.name,
      arguments: dto.arguments,
      sessionId: dto.sessionId,
      userId: user?.id || dto.userId || 'anonymous',
      correlationId: dto.correlationId,
    });
  }
}

