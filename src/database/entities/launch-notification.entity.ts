import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Property } from './property.entity';

export enum NotificationTiming {
  ONE_HOUR = '1h',
  ONE_DAY = '1d',
  AT_LAUNCH = 'launch',
}

@Entity('launch_notifications')
@Unique(['email', 'propertyId'])
@Index(['propertyId'])
@Index(['email'])
@Index(['notifiedAt'])
export class LaunchNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'uuid' })
  propertyId: string;

  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column({
    type: 'enum',
    enum: NotificationTiming,
    default: NotificationTiming.AT_LAUNCH,
  })
  timing: NotificationTiming;

  @Column({ type: 'varchar', length: 10, default: 'en' })
  locale: string;

  @Column({ type: 'timestamp', nullable: true })
  notifiedAt: Date | null;

  @Column({ type: 'boolean', default: false })
  isNotified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


