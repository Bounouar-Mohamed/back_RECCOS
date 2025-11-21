import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IVerificationProvider, VerificationResult } from './verification-provider.interface';
import { DocumentType, VerificationStatus } from '../../database/entities/identity-document.entity';

@Injectable()
export class OnfidoVerificationService implements IVerificationProvider {
  private readonly logger = new Logger(OnfidoVerificationService.name);
  private readonly apiToken: string;
  private readonly apiUrl = 'https://api.onfido.com/v3';

  constructor(private configService: ConfigService) {
    this.apiToken = this.configService.get<string>('onfido.apiToken') || '';
  }

  async verifyDocument(
    documentType: DocumentType,
    frontImageUrl: string,
    backImageUrl?: string,
  ): Promise<VerificationResult> {
    try {
      // Créer un applicant
      const applicantResponse = await fetch(`${this.apiUrl}/applicants`, {
        method: 'POST',
        headers: {
          'Authorization': `Token token=${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: 'User',
          last_name: 'Name',
        }),
      });

      const applicant = await applicantResponse.json();

      // Créer un document check
      const documentTypeMap = {
        [DocumentType.EMIRATES_ID]: 'national_identity_card',
        [DocumentType.PASSPORT]: 'passport',
      };

      const documentResponse = await fetch(`${this.apiUrl}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Token token=${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicant_id: applicant.id,
          type: documentTypeMap[documentType],
          file: frontImageUrl,
          side: 'front',
        }),
      });

      const document = await documentResponse.json();

      // Créer un check
      const checkResponse = await fetch(`${this.apiUrl}/checks`, {
        method: 'POST',
        headers: {
          'Authorization': `Token token=${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicant_id: applicant.id,
          report_names: ['document', 'facial_similarity_photo'],
        }),
      });

      const check = await checkResponse.json();

      return {
        success: check.status === 'complete' && check.result === 'clear',
        status: this.mapStatus(check.status, check.result),
        extractedData: document.properties,
        verificationId: check.id,
      };
    } catch (error) {
      this.logger.error('Onfido verification error', error);
      return {
        success: false,
        status: VerificationStatus.REJECTED,
        rejectionReason: error.message,
        verificationId: '',
      };
    }
  }

  async verifyFace(
    documentImageUrl: string,
    selfieImageUrl: string,
  ): Promise<{ success: boolean; matchScore: number; reason?: string }> {
    try {
      // Utiliser l'API de comparaison faciale d'Onfido
      const response = await fetch(`${this.apiUrl}/liveness/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token token=${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicant_id: 'temp',
          file: selfieImageUrl,
        }),
      });

      const result = await response.json();
      const matchScore = result.similarity_score || 0;

      return {
        success: matchScore >= 0.8,
        matchScore,
        reason: matchScore < 0.8 ? 'Face match score too low' : undefined,
      };
    } catch (error) {
      this.logger.error('Face verification error', error);
      return {
        success: false,
        matchScore: 0,
        reason: error.message,
      };
    }
  }

  async verifyDocumentAndFace(
    documentType: DocumentType,
    frontImageUrl: string,
    backImageUrl: string | null,
    selfieImageUrl: string,
  ): Promise<VerificationResult> {
    const documentResult = await this.verifyDocument(documentType, frontImageUrl, backImageUrl || undefined);
    const faceResult = await this.verifyFace(frontImageUrl, selfieImageUrl);

    return {
      ...documentResult,
      faceMatchScore: faceResult.matchScore,
      success: documentResult.success && faceResult.success,
      status: documentResult.success && faceResult.success 
        ? VerificationStatus.VERIFIED 
        : VerificationStatus.REJECTED,
    };
  }

  private mapStatus(status: string, result: string): VerificationStatus {
    if (status === 'complete' && result === 'clear') {
      return VerificationStatus.VERIFIED;
    }
    if (status === 'complete' && result === 'consider') {
      return VerificationStatus.IN_PROGRESS;
    }
    if (result === 'unclear' || result === 'rejected') {
      return VerificationStatus.REJECTED;
    }
    return VerificationStatus.PENDING;
  }
}
