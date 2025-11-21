import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveContactFieldsFromProperties1720900000000 implements MigrationInterface {
  name = 'RemoveContactFieldsFromProperties1720900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Supprimer les colonnes de contact direct si elles existent
    // Le contact se fait via la plateforme, pas directement avec le DEVELOPER
    await queryRunner.query(`
      ALTER TABLE "properties" 
      DROP COLUMN IF EXISTS "contactPhone",
      DROP COLUMN IF EXISTS "contactEmail",
      DROP COLUMN IF EXISTS "contactName"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restaurer les colonnes si nécessaire (rollback)
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN IF NOT EXISTS "contactPhone" varchar(50),
      ADD COLUMN IF NOT EXISTS "contactEmail" varchar(255),
      ADD COLUMN IF NOT EXISTS "contactName" varchar(255)
    `);
  }
}
















