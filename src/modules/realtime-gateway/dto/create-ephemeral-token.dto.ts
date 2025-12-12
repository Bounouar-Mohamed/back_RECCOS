import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEphemeralTokenDto {
  @ApiPropertyOptional({ description: 'ID utilisateur (optionnel, peut être dérivé du JWT)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'ID tenant' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'ID de conversation pour continuité' })
  @IsOptional()
  @IsString()
  conversationId?: string;
}

