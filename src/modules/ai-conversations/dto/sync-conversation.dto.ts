import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

const ROLES = ['user', 'assistant', 'system'] as const;
type Role = (typeof ROLES)[number];

export class SyncConversationMessageDto {
  @ApiProperty({ enum: ROLES })
  @IsIn(ROLES)
  role: Role;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  promptTokens?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  completionTokens?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalTokens?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  durationMs?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  timestamp?: string;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class SyncConversationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  assistantThreadId?: string;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ type: [SyncConversationMessageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncConversationMessageDto)
  messages: SyncConversationMessageDto[];
}

