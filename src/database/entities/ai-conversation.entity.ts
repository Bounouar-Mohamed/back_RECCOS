import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AiMessageEntity } from './ai-message.entity';

@Entity('ai_conversations')
export class AiConversationEntity extends BaseEntity {
  @Column({ unique: true })
  conversationId: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  tenantId?: string;

  @Column({ nullable: true })
  assistantThreadId?: string;

  @Column({ nullable: true })
  lastModel?: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  lastActivityAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => AiMessageEntity, (message) => message.conversation, {
    cascade: true,
  })
  messages: AiMessageEntity[];
}

