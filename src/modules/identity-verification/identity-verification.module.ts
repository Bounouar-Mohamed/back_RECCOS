import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { IdentityVerificationController } from './identity-verification.controller';
import { IdentityVerificationService } from './services/identity-verification.service';
import { IdentityDocument } from '../../database/entities/identity-document.entity';
import { KYCStatus } from '../../database/entities/kyc-status.entity';
import { SumsubVerificationService } from '../../common/services/sumsub-verification.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([IdentityDocument, KYCStatus]),
    ConfigModule,
  ],
  controllers: [IdentityVerificationController],
  providers: [IdentityVerificationService, SumsubVerificationService],
  exports: [IdentityVerificationService],
})
export class IdentityVerificationModule {}
