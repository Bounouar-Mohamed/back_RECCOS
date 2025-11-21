import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { IdentityVerificationService } from '../../modules/identity-verification/services/identity-verification.service';
import { KYCLevel } from '../../database/entities/kyc-status.entity';

@Injectable()
export class KYCRequiredGuard implements CanActivate {
  constructor(private identityVerificationService: IdentityVerificationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const kycStatus = await this.identityVerificationService.getKYCStatus(user.id);

    if (kycStatus.level !== KYCLevel.VERIFIED && kycStatus.level !== KYCLevel.FULL_VERIFIED) {
      throw new ForbiddenException(
        'KYC verification is required. Please complete your identity verification before proceeding.',
      );
    }

    return true;
  }
}
