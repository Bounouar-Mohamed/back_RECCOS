import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOAuthIdsToUsers1721100000000 implements MigrationInterface {
  name = 'AddOAuthIdsToUsers1721100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "uaePassId" varchar(255),
      ADD COLUMN "googleId" varchar(255),
      ADD COLUMN "facebookId" varchar(255),
      ADD COLUMN "appleId" varchar(255)
    `);

    // Créer des index pour les recherches rapides
    await queryRunner.query(`
      CREATE INDEX "IDX_users_uaePassId" ON "users" ("uaePassId") 
      WHERE "uaePassId" IS NOT NULL;
      CREATE INDEX "IDX_users_googleId" ON "users" ("googleId") 
      WHERE "googleId" IS NOT NULL;
      CREATE INDEX "IDX_users_facebookId" ON "users" ("facebookId") 
      WHERE "facebookId" IS NOT NULL;
      CREATE INDEX "IDX_users_appleId" ON "users" ("appleId") 
      WHERE "appleId" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_appleId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_facebookId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_googleId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_uaePassId"`);
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "appleId",
      DROP COLUMN IF EXISTS "facebookId",
      DROP COLUMN IF EXISTS "googleId",
      DROP COLUMN IF EXISTS "uaePassId"
    `);
  }
}
















