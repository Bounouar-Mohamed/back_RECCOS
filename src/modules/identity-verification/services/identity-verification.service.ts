import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdentityDocument, DocumentType, VerificationStatus } from '../../../database/entities/identity-document.entity';
import { KYCStatus, KYCLevel } from '../../../database/entities/kyc-status.entity';
import { SumsubVerificationService } from '../../../common/services/sumsub-verification.service';
import { UploadDocumentDto } from '../dto/upload-document.dto';
import { VerifyFaceDto } from '../dto/verify-face.dto';

@Injectable()
export class IdentityVerificationService {
  constructor(
    @InjectRepository(IdentityDocument)
    private identityDocumentRepository: Repository<IdentityDocument>,
    @InjectRepository(KYCStatus)
    private kycStatusRepository: Repository<KYCStatus>,
    private verificationProvider: SumsubVerificationService,
  ) {}

  async uploadDocument(
    userId: string,
    uploadDto: UploadDocumentDto,
    frontImageUrl: string,
    backImageUrl?: string,
  ): Promise<IdentityDocument> {
    // Vérifier qu'il n'y a pas déjà un document actif
    const existingDoc = await this.identityDocumentRepository.findOne({
      where: {
        userId,
        documentType: uploadDto.documentType,
        isActive: true,
        status: VerificationStatus.VERIFIED,
      },
    });

    if (existingDoc) {
      throw new BadRequestException('Un document vérifié de ce type existe déjà');
    }

    const document = this.identityDocumentRepository.create({
      userId,
      documentType: uploadDto.documentType,
      documentNumber: uploadDto.documentNumber,
      frontImageUrl,
      backImageUrl: backImageUrl || null,
      status: VerificationStatus.PENDING,
      isActive: true,
    });

    return this.identityDocumentRepository.save(document);
  }

  async uploadSelfie(documentId: string, selfieImageUrl: string): Promise<IdentityDocument> {
    const document = await this.identityDocumentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.selfieImageUrl = selfieImageUrl;
    return this.identityDocumentRepository.save(document);
  }

  async verifyDocumentAndFace(documentId: string): Promise<IdentityDocument> {
    const document = await this.identityDocumentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (!document.selfieImageUrl) {
      throw new BadRequestException('Selfie is required for verification');
    }

    // Mettre à jour le statut
    document.status = VerificationStatus.IN_PROGRESS;
    await this.identityDocumentRepository.save(document);

    try {
      // Vérifier le document et le visage
      const verificationResult = await this.verificationProvider.verifyDocumentAndFace(
        document.documentType,
        document.frontImageUrl,
        document.backImageUrl,
        document.selfieImageUrl,
      );

      // Mettre à jour le document avec les résultats
      document.status = verificationResult.status;
      document.verificationData = {
        provider: 'sumsub',
        verificationId: verificationResult.verificationId,
        faceMatchScore: verificationResult.faceMatchScore,
        documentMatchScore: verificationResult.documentMatchScore,
        extractedData: verificationResult.extractedData,
        rejectionReason: verificationResult.rejectionReason,
      };

      if (verificationResult.status === VerificationStatus.VERIFIED) {
        document.verifiedAt = new Date();
        // Mettre à jour le statut KYC de l'utilisateur
        await this.updateKYCStatus(document.userId, true);
      }

      return this.identityDocumentRepository.save(document);
    } catch (error) {
      document.status = VerificationStatus.REJECTED;
      document.verificationData = {
        provider: 'sumsub',
        verificationId: '',
        rejectionReason: error.message,
      };
      await this.identityDocumentRepository.save(document);
      throw error;
    }
  }

  async getDocumentStatus(documentId: string): Promise<IdentityDocument> {
    const document = await this.identityDocumentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async getUserDocuments(userId: string): Promise<IdentityDocument[]> {
    return this.identityDocumentRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getKYCStatus(userId: string): Promise<KYCStatus> {
    let kycStatus = await this.kycStatusRepository.findOne({
      where: { userId },
    });

    if (!kycStatus) {
      kycStatus = this.kycStatusRepository.create({
        userId,
        level: KYCLevel.NONE,
      });
      await this.kycStatusRepository.save(kycStatus);
    }

    return kycStatus;
  }

  private async updateKYCStatus(userId: string, verified: boolean): Promise<void> {
    let kycStatus = await this.kycStatusRepository.findOne({
      where: { userId },
    });

    if (!kycStatus) {
      kycStatus = this.kycStatusRepository.create({ userId });
    }

    kycStatus.identityVerified = verified;
    kycStatus.faceVerified = verified;
    kycStatus.documentVerified = verified;
    kycStatus.level = verified ? KYCLevel.VERIFIED : KYCLevel.BASIC;
    kycStatus.verifiedAt = verified ? new Date() : null;
    kycStatus.lastVerificationAttempt = new Date();

    await this.kycStatusRepository.save(kycStatus);
  }

  async checkKYCRequired(userId: string): Promise<boolean> {
    const kycStatus = await this.getKYCStatus(userId);
    return kycStatus.level === KYCLevel.NONE || kycStatus.level === KYCLevel.BASIC;
  }
}
