import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('developer_brands')
@Index(['name'], { unique: true })
export class DeveloperBrand extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  logoUrl: string | null;
}


