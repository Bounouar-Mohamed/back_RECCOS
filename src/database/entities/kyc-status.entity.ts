import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum KYCLevel {
  NONE = 'none',
  BASIC = 'basic',
  VERIFIED = 'verified',
  FULL_VERIFIED = 'full_verified',
}

@Entity('kyc_status')
export class KYCStatus extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'uuid', unique: true })
  userId: string;

  @Column({ type: 'enum', enum: KYCLevel, default: KYCLevel.NONE })
  level: KYCLevel;

  @Column({ type: 'boolean', default: false })
  identityVerified: boolean;

  @Column({ type: 'boolean', default: false })
  faceVerified: boolean;

  @Column({ type: 'boolean', default: false })
  documentVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastVerificationAttempt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    verificationProvider?: string;
    attemptsCount?: number;
    lastRejectionReason?: string;
  };
}
