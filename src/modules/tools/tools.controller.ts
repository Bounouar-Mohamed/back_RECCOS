import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ExecuteToolDto } from './dto/execute-tool.dto';
import { ToolsService } from './tools.service';
import { InternalKeyGuard } from '../../common/guards/internal-key.guard';

@ApiTags('internal-tools')
@Controller('internal/tools')
@UseGuards(InternalKeyGuard)
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post('execute')
  @ApiOperation({
    summary: 'Exécuter un tool interne (appelé par Quantix)',
  })
  @ApiResponse({ status: 200, description: 'Tool exécuté' })
  async execute(@Body() dto: ExecuteToolDto) {
    return this.toolsService.execute(dto);
  }
}

