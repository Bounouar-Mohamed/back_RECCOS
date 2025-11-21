import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IVerificationProvider } from './verification-provider.interface';
import { OnfidoVerificationService } from './onfido-verification.service';
import { FreeVerificationService } from './free-verification.service';

/**
 * Factory pour choisir le service de vérification
 * 
 * Stratégies :
 * - 'onfido' : Service payant Onfido (recommandé pour production)
 * - 'free' : Service gratuit maison (pour développement/MVP)
 * - 'hybrid' : Essaie payant d'abord, fallback gratuit
 */
@Injectable()
export class VerificationFactoryService {
  constructor(
    private configService: ConfigService,
    private onfidoService: OnfidoVerificationService,
    private freeService: FreeVerificationService,
  ) {}

  getProvider(): IVerificationProvider {
    const strategy = this.configService.get<string>('verification.strategy', 'free');

    switch (strategy) {
      case 'onfido':
        return this.onfidoService;
      case 'free':
        return this.freeService;
      case 'hybrid':
        return new HybridVerificationService(this.onfidoService, this.freeService);
      default:
        return this.freeService;
    }
  }
}

/**
 * Service hybride : essaie payant, fallback gratuit
 */
class HybridVerificationService implements IVerificationProvider {
  private readonly logger = new Logger(HybridVerificationService.name);

  constructor(
    private paidService: IVerificationProvider,
    private freeService: IVerificationProvider,
  ) {}

  async verifyDocument(type: any, front: string, back?: string) {
    try {
      return await this.paidService.verifyDocument(type, front, back);
    } catch (error) {
      this.logger.warn(
        'Paid service failed, using free service',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return await this.freeService.verifyDocument(type, front, back);
    }
  }

  async verifyFace(doc: string, selfie: string) {
    try {
      return await this.paidService.verifyFace(doc, selfie);
    } catch (error) {
      this.logger.warn(
        'Paid service failed, using free service',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return await this.freeService.verifyFace(doc, selfie);
    }
  }

  async verifyDocumentAndFace(type: any, front: string, back: string | null, selfie: string) {
    try {
      return await this.paidService.verifyDocumentAndFace(type, front, back, selfie);
    } catch (error) {
      this.logger.warn(
        'Paid service failed, using free service',
        error instanceof Error ? error.message : 'Unknown error',
      );
      return await this.freeService.verifyDocumentAndFace(type, front, back, selfie);
    }
  }
}
