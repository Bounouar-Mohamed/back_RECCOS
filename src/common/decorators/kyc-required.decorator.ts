import { UseGuards, applyDecorators } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { KYCRequiredGuard } from '../guards/kyc-required.guard';

export const KYCRequired = () => {
  return applyDecorators(UseGuards(JwtAuthGuard, KYCRequiredGuard));
};
