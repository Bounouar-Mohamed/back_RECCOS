import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum DocumentType {
  EMIRATES_ID = 'emirates_id',
  PASSPORT = 'passport',
}

export enum VerificationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('identity_documents')
export class IdentityDocument extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: DocumentType })
  documentType: DocumentType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  documentNumber: string;

  @Column({ type: 'varchar', length: 500 })
  frontImageUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  backImageUrl: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  selfieImageUrl: string;

  @Column({ type: 'enum', enum: VerificationStatus, default: VerificationStatus.PENDING })
  status: VerificationStatus;

  @Column({ type: 'jsonb', nullable: true })
  verificationData: {
    provider: string;
    verificationId: string;
    faceMatchScore?: number;
    documentMatchScore?: number;
    extractedData?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      nationality?: string;
      expiryDate?: string;
    };
    rejectionReason?: string;
  };

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;
}
