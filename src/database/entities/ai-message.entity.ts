import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { AiConversationEntity } from './ai-conversation.entity';

@Entity('ai_messages')
export class AiMessageEntity extends BaseEntity {
  @ManyToOne(() => AiConversationEntity, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  conversation: AiConversationEntity;

  @Column({ length: 32 })
  role: 'user' | 'assistant' | 'system';

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  model?: string;

  @Column({ type: 'int', nullable: true })
  promptTokens?: number;

  @Column({ type: 'int', nullable: true })
  completionTokens?: number;

  @Column({ type: 'int', nullable: true })
  totalTokens?: number;

  @Column({ type: 'int', nullable: true })
  durationMs?: number;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  messageTimestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}

