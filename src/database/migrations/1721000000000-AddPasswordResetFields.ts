import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasswordResetFields1721000000000 implements MigrationInterface {
  name = 'AddPasswordResetFields1721000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "passwordResetToken" varchar(255),
      ADD COLUMN "passwordResetTokenExpiresAt" timestamp
    `);

    // Créer un index pour les recherches rapides
    await queryRunner.query(`
      CREATE INDEX "IDX_users_passwordResetToken" ON "users" ("passwordResetToken") 
      WHERE "passwordResetToken" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_passwordResetToken"`);
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "passwordResetToken",
      DROP COLUMN IF EXISTS "passwordResetTokenExpiresAt"
    `);
  }
}
















