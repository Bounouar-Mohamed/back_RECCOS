import { Module } from '@nestjs/common';
import { PurchasesController } from './purchases.controller';
import { PurchasesService } from './purchases.service';
import { EmailService } from '../../common/services/email.service';

@Module({
  controllers: [PurchasesController],
  providers: [PurchasesService, EmailService],
  exports: [PurchasesService],
})
export class PurchasesModule {}


