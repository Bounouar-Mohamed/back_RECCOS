import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('purchases')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a simulated purchase and send confirmation email' })
  @ApiResponse({ status: 200, description: 'Purchase completed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async createPurchase(@Body() createPurchaseDto: CreatePurchaseDto) {
    return this.purchasesService.createPurchase(createPurchaseDto);
  }
}


