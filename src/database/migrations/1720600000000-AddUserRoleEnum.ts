import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoleEnum1720600000000 implements MigrationInterface {
  name = 'AddUserRoleEnum1720600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer le type enum pour les rôles
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_role_enum" AS ENUM ('client', 'developer', 'admin');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Mettre à jour les valeurs existantes (si 'user' existe, le convertir en 'client')
    await queryRunner.query(`
      UPDATE "users" 
      SET "role" = 'client' 
      WHERE "role" IS NULL OR "role" NOT IN ('client', 'developer', 'admin');
    `);

    // Changer le type de la colonne role de varchar à enum
    // Étape 1: Créer une nouvelle colonne temporaire
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "role_temp" "user_role_enum" DEFAULT 'client';
    `);

    // Étape 2: Copier les données avec conversion
    await queryRunner.query(`
      UPDATE "users" 
      SET "role_temp" = CASE 
        WHEN "role" = 'client' THEN 'client'::"user_role_enum"
        WHEN "role" = 'developer' THEN 'developer'::"user_role_enum"
        WHEN "role" = 'admin' THEN 'admin'::"user_role_enum"
        ELSE 'client'::"user_role_enum"
      END;
    `);

    // Étape 3: Supprimer l'ancienne colonne
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "role";
    `);

    // Étape 4: Renommer la nouvelle colonne
    await queryRunner.query(`
      ALTER TABLE "users" 
      RENAME COLUMN "role_temp" TO "role";
    `);

    // Étape 5: Définir NOT NULL et la valeur par défaut
    await queryRunner.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "role" SET NOT NULL,
      ALTER COLUMN "role" SET DEFAULT 'client';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revenir au type varchar
    await queryRunner.query(`
      ALTER TABLE "users" 
      ALTER COLUMN "role" TYPE varchar(50);
    `);

    // Supprimer le type enum
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
  }
}

