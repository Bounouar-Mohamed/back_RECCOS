import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAiConversationsTables1766000003000 implements MigrationInterface {
  name = 'CreateAiConversationsTables1766000003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ai_conversations" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "conversationId" character varying NOT NULL,
        "userId" character varying NOT NULL,
        "tenantId" character varying,
        "assistantThreadId" character varying,
        "lastModel" character varying,
        "lastActivityAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "metadata" jsonb,
        CONSTRAINT "UQ_ai_conversation_conversation" UNIQUE ("conversationId"),
        CONSTRAINT "PK_ai_conversations_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "ai_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        "role" character varying(32) NOT NULL,
        "content" text NOT NULL,
        "model" character varying,
        "promptTokens" integer,
        "completionTokens" integer,
        "totalTokens" integer,
        "durationMs" integer,
        "messageTimestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "metadata" jsonb,
        "conversationId" uuid NOT NULL,
        CONSTRAINT "PK_ai_messages_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_messages_conversation" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      );
    `);

    await queryRunner.query(`CREATE INDEX "IDX_ai_messages_conversation" ON "ai_messages" ("conversationId");`);
    await queryRunner.query(`CREATE INDEX "IDX_ai_messages_role" ON "ai_messages" ("role");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_ai_messages_role";`);
    await queryRunner.query(`DROP INDEX "IDX_ai_messages_conversation";`);
    await queryRunner.query(`DROP TABLE "ai_messages";`);
    await queryRunner.query(`DROP TABLE "ai_conversations";`);
  }
}

