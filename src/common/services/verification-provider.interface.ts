import { DocumentType, VerificationStatus } from '../../database/entities/identity-document.entity';

export interface VerificationResult {
  success: boolean;
  status: VerificationStatus;
  faceMatchScore?: number;
  documentMatchScore?: number;
  extractedData?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    nationality?: string;
    expiryDate?: string;
    documentNumber?: string;
  };
  rejectionReason?: string;
  verificationId: string;
}

export interface IVerificationProvider {
  verifyDocument(
    documentType: DocumentType,
    frontImageUrl: string,
    backImageUrl?: string,
  ): Promise<VerificationResult>;

  verifyFace(
    documentImageUrl: string,
    selfieImageUrl: string,
  ): Promise<{ success: boolean; matchScore: number; reason?: string }>;

  verifyDocumentAndFace(
    documentType: DocumentType,
    frontImageUrl: string,
    backImageUrl: string | null,
    selfieImageUrl: string,
  ): Promise<VerificationResult>;
}
