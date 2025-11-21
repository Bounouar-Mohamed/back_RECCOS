import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSecurityFields1721300000000 implements MigrationInterface {
  name = 'AddSecurityFields1721300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "failedLoginAttempts" integer DEFAULT 0,
      ADD COLUMN "accountLockedUntil" timestamp,
      ADD COLUMN "twoFactorTempCode" varchar(255),
      ADD COLUMN "twoFactorTempCodeExpiresAt" timestamp,
      ADD COLUMN "failed2FAAttempts" integer DEFAULT 0,
      ADD COLUMN "usedResetTokens" jsonb
    `);

    // Index pour les recherches de verrouillage
    await queryRunner.query(`
      CREATE INDEX "IDX_users_accountLockedUntil" ON "users" ("accountLockedUntil") 
      WHERE "accountLockedUntil" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_accountLockedUntil"`);
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "usedResetTokens",
      DROP COLUMN IF EXISTS "failed2FAAttempts",
      DROP COLUMN IF EXISTS "twoFactorTempCodeExpiresAt",
      DROP COLUMN IF EXISTS "twoFactorTempCode",
      DROP COLUMN IF EXISTS "accountLockedUntil",
      DROP COLUMN IF EXISTS "failedLoginAttempts"
    `);
  }
}
















