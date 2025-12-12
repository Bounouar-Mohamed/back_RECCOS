import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const ROLES = ['system', 'user', 'assistant'] as const;
export type MessageRole = (typeof ROLES)[number];

export class AiChatMessageDto {
  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  role: MessageRole;

  @ApiProperty()
  @IsString()
  content: string;
}

export class AiChatDto {
  @ApiProperty({ type: [AiChatMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AiChatMessageDto)
  messages: AiChatMessageDto[];

  @ApiProperty({ required: false, description: 'Identifiant conversation (sinon généré)' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ required: false, minimum: 0, maximum: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxTokens?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiProperty({ required: false, description: 'Forcer Assistants API' })
  @IsOptional()
  useAssistants?: boolean;
}

