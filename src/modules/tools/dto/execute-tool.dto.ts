import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

const TOOL_NAMES = ['create_automation', 'analyze_client', 'log_to_crm'] as const;
type ToolName = (typeof TOOL_NAMES)[number];

export class ExecuteToolDto {
  @ApiProperty({ enum: TOOL_NAMES })
  @IsIn(TOOL_NAMES)
  name: ToolName;

  @ApiProperty({ description: 'Payload fonctionnel' })
  @IsObject()
  payload: Record<string, any>;

  @ApiProperty({ description: 'Métadonnées optionnelles', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Utilisateur ayant déclenché le tool', required: false })
  @IsOptional()
  @IsString()
  requestedBy?: string;
}

