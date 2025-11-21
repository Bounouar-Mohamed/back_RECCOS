import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IVerificationProvider, VerificationResult } from './verification-provider.interface';
import { DocumentType, VerificationStatus } from '../../database/entities/identity-document.entity';
import * as crypto from 'crypto';

/**
 * Service de vérification d'identité utilisant Sumsub
 * 
 * Sumsub prend en charge :
 * - Passeports UAE et internationaux
 * - Emirates ID
 * - Vérification faciale (liveness check)
 * - Extraction automatique de données
 * 
 * Documentation API : https://developers.sumsub.com/api-reference
 */
@Injectable()
export class SumsubVerificationService implements IVerificationProvider {
  private readonly logger = new Logger(SumsubVerificationService.name);
  private readonly appToken: string;
  private readonly secretKey: string;
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.appToken = this.configService.get<string>('sumsub.appToken') || '';
    this.secretKey = this.configService.get<string>('sumsub.secretKey') || '';
    this.apiUrl = this.configService.get<string>('sumsub.apiUrl') || 'https://api.sumsub.com';
  }

  /**
   * Créer une signature pour l'authentification Sumsub
   */
  private createSignature(ts: number, method: string, path: string, body?: string): string {
    const data = `${ts}${method}${path}${body || ''}`;
    return crypto.createHmac('sha256', this.secretKey).update(data).digest('hex');
  }

  /**
   * Créer un applicant dans Sumsub
   */
  private async createApplicant(userId: string, userInfo: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    nationality?: string;
  }): Promise<string> {
    const path = '/resources/applicants?levelName=basic-kyc-level';
    const ts = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      externalUserId: userId,
      email: userInfo.firstName ? `${userInfo.firstName.toLowerCase()}.${userInfo.lastName?.toLowerCase()}@example.com` : undefined,
      info: {
        firstName: userInfo.firstName,
        lastName: userInfo.lastName,
        dob: userInfo.dateOfBirth,
        nationality: userInfo.nationality || 'ARE', // UAE par défaut
      },
    });

    const signature = this.createSignature(ts, 'POST', path, body);

    const response = await fetch(`${this.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'X-App-Token': this.appToken,
        'X-App-Access-Sig': signature,
        'X-App-Access-Ts': ts.toString(),
        'Content-Type': 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create applicant: ${error}`);
    }

    const applicant = await response.json();
    return applicant.id;
  }

  /**
   * Uploader un document vers Sumsub
   */
  private async uploadDocument(
    applicantId: string,
    documentType: DocumentType,
    imageUrl: string,
    imageType: 'front' | 'back',
  ): Promise<string> {
    // Télécharger l'image depuis l'URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image from ${imageUrl}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    // Mapper les types de documents Sumsub
    const sumsubDocType = this.mapDocumentType(documentType);

    const path = `/resources/applicants/${applicantId}/info/idDoc`;
    const ts = Math.floor(Date.now() / 1000);

    // Créer le formulaire multipart
    const formData = new FormData();
    formData.append('metadata', JSON.stringify({
      idDocType: sumsubDocType,
      idDocSubType: imageType === 'front' ? 'front' : 'back',
      country: 'ARE', // UAE
    }));

    // Convertir ArrayBuffer en Blob
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('content', blob, 'document.jpg');

    // Pour FormData, on doit calculer la signature différemment
    // Sumsub accepte aussi les requêtes avec body vide pour la signature
    const signature = this.createSignature(ts, 'POST', path);

    const response = await fetch(`${this.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'X-App-Token': this.appToken,
        'X-App-Access-Sig': signature,
        'X-App-Access-Ts': ts.toString(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload document: ${error}`);
    }

    const result = await response.json();
    return result.idDoc?.id || '';
  }

  /**
   * Uploader un selfie pour la vérification faciale
   */
  private async uploadSelfie(applicantId: string, selfieUrl: string): Promise<void> {
    const imageResponse = await fetch(selfieUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download selfie from ${selfieUrl}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();

    const path = `/resources/applicants/${applicantId}/info/idDoc`;
    const ts = Math.floor(Date.now() / 1000);

    const formData = new FormData();
    formData.append('metadata', JSON.stringify({
      idDocType: 'SELFIE',
    }));

    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('content', blob, 'selfie.jpg');

    const signature = this.createSignature(ts, 'POST', path);

    const response = await fetch(`${this.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'X-App-Token': this.appToken,
        'X-App-Access-Sig': signature,
        'X-App-Access-Ts': ts.toString(),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload selfie: ${error}`);
    }
  }

  /**
   * Lancer une vérification (check) dans Sumsub
   */
  private async createCheck(applicantId: string): Promise<any> {
    const path = `/resources/applicants/${applicantId}/status/pending?levelName=basic-kyc-level`;
    const ts = Math.floor(Date.now() / 1000);
    const signature = this.createSignature(ts, 'POST', path);

    const response = await fetch(`${this.apiUrl}${path}`, {
      method: 'POST',
      headers: {
        'X-App-Token': this.appToken,
        'X-App-Access-Sig': signature,
        'X-App-Access-Ts': ts.toString(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create check: ${error}`);
    }

    return response.json();
  }

  /**
   * Obtenir le statut d'un applicant
   */
  private async getApplicantStatus(applicantId: string): Promise<any> {
    const path = `/resources/applicants/${applicantId}/status`;
    const ts = Math.floor(Date.now() / 1000);
    const signature = this.createSignature(ts, 'GET', path);

    const response = await fetch(`${this.apiUrl}${path}`, {
      method: 'GET',
      headers: {
        'X-App-Token': this.appToken,
        'X-App-Access-Sig': signature,
        'X-App-Access-Ts': ts.toString(),
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get applicant status: ${error}`);
    }

    return response.json();
  }

  /**
   * Mapper les types de documents vers les types Sumsub
   */
  private mapDocumentType(documentType: DocumentType): string {
    const mapping = {
      [DocumentType.EMIRATES_ID]: 'ID_CARD',
      [DocumentType.PASSPORT]: 'PASSPORT',
    };
    return mapping[documentType] || 'ID_CARD';
  }

  /**
   * Mapper le statut Sumsub vers notre enum
   */
  private mapStatus(sumsubStatus: string): VerificationStatus {
    const statusMap: Record<string, VerificationStatus> = {
      'init': VerificationStatus.PENDING,
      'pending': VerificationStatus.PENDING,
      'queued': VerificationStatus.IN_PROGRESS,
      'processing': VerificationStatus.IN_PROGRESS,
      'approved': VerificationStatus.VERIFIED,
      'completed': VerificationStatus.VERIFIED,
      'rejected': VerificationStatus.REJECTED,
      'failed': VerificationStatus.REJECTED,
    };
    return statusMap[sumsubStatus.toLowerCase()] || VerificationStatus.PENDING;
  }

  async verifyDocument(
    documentType: DocumentType,
    frontImageUrl: string,
    backImageUrl?: string,
  ): Promise<VerificationResult> {
    try {
      // Pour Sumsub, on a besoin d'un applicantId
      // On va créer un applicant temporaire ou utiliser celui existant
      // Pour l'instant, on va créer un applicant avec un ID temporaire
      const tempUserId = `temp_${Date.now()}`;
      const applicantId = await this.createApplicant(tempUserId, {});

      // Uploader le document front
      await this.uploadDocument(applicantId, documentType, frontImageUrl, 'front');

      // Uploader le document back si fourni
      if (backImageUrl) {
        await this.uploadDocument(applicantId, documentType, backImageUrl, 'back');
      }

      // Lancer la vérification
      await this.createCheck(applicantId);

      // Obtenir le statut
      const status = await this.getApplicantStatus(applicantId);

      return {
        success: status.reviewResult?.reviewAnswer === 'GREEN',
        status: this.mapStatus(status.reviewStatus || 'pending'),
        extractedData: this.extractDataFromStatus(status),
        verificationId: applicantId,
        rejectionReason: status.reviewResult?.reviewAnswer === 'RED' 
          ? status.reviewResult?.rejectLabels?.join(', ') 
          : undefined,
      };
    } catch (error) {
      this.logger.error('Sumsub verification error', error);
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
      // Sumsub fait la vérification faciale automatiquement lors du check
      // On peut utiliser l'API de liveness check
      const tempUserId = `temp_${Date.now()}`;
      const applicantId = await this.createApplicant(tempUserId, {});

      // Uploader le document
      await this.uploadDocument(applicantId, DocumentType.PASSPORT, documentImageUrl, 'front');

      // Uploader le selfie
      await this.uploadSelfie(applicantId, selfieImageUrl);

      // Lancer la vérification
      await this.createCheck(applicantId);

      // Obtenir le statut
      const status = await this.getApplicantStatus(applicantId);

      const faceMatchScore = status.liveness?.score || 0.8;
      const success = status.reviewResult?.reviewAnswer === 'GREEN' && faceMatchScore >= 0.7;

      return {
        success,
        matchScore: faceMatchScore,
        reason: !success ? 'Face verification failed or score too low' : undefined,
      };
    } catch (error) {
      this.logger.error('Sumsub face verification error', error);
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
    try {
      const tempUserId = `temp_${Date.now()}`;
      const applicantId = await this.createApplicant(tempUserId, {});

      // Uploader le document front
      await this.uploadDocument(applicantId, documentType, frontImageUrl, 'front');

      // Uploader le document back si fourni
      if (backImageUrl) {
        await this.uploadDocument(applicantId, documentType, backImageUrl, 'back');
      }

      // Uploader le selfie
      await this.uploadSelfie(applicantId, selfieImageUrl);

      // Lancer la vérification
      await this.createCheck(applicantId);

      // Obtenir le statut
      const status = await this.getApplicantStatus(applicantId);

      const faceMatchScore = status.liveness?.score || 0.8;
      const isApproved = status.reviewResult?.reviewAnswer === 'GREEN';
      const finalStatus = isApproved && faceMatchScore >= 0.7 
        ? VerificationStatus.VERIFIED 
        : VerificationStatus.REJECTED;

      return {
        success: isApproved && faceMatchScore >= 0.7,
        status: finalStatus,
        faceMatchScore,
        documentMatchScore: status.reviewResult?.reviewAnswer === 'GREEN' ? 1.0 : 0.0,
        extractedData: this.extractDataFromStatus(status),
        verificationId: applicantId,
        rejectionReason: !isApproved 
          ? status.reviewResult?.rejectLabels?.join(', ') 
          : faceMatchScore < 0.7 
            ? 'Face match score too low' 
            : undefined,
      };
    } catch (error) {
      this.logger.error('Sumsub document and face verification error', error);
      return {
        success: false,
        status: VerificationStatus.REJECTED,
        rejectionReason: error.message,
        verificationId: '',
      };
    }
  }

  /**
   * Extraire les données du statut Sumsub
   */
  private extractDataFromStatus(status: any): any {
    const info = status.info || {};
    return {
      firstName: info.firstName,
      lastName: info.lastName,
      dateOfBirth: info.dob,
      nationality: info.nationality,
      documentNumber: status.idDocs?.[0]?.number,
    };
  }
}
