import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLaunchNotificationsTable1733320000000 implements MigrationInterface {
  name = 'CreateLaunchNotificationsTable1733320000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer le type enum pour le timing
    await queryRunner.query(`
      CREATE TYPE "public"."launch_notifications_timing_enum" AS ENUM('1h', '1d', 'launch')
    `);

    // Créer la table launch_notifications
    await queryRunner.query(`
      CREATE TABLE "launch_notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "propertyId" uuid NOT NULL,
        "timing" "public"."launch_notifications_timing_enum" NOT NULL DEFAULT 'launch',
        "locale" character varying(10) NOT NULL DEFAULT 'en',
        "notifiedAt" TIMESTAMP,
        "isNotified" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_launch_notifications_email_property" UNIQUE ("email", "propertyId"),
        CONSTRAINT "PK_launch_notifications" PRIMARY KEY ("id")
      )
    `);

    // Créer les index
    await queryRunner.query(`
      CREATE INDEX "IDX_launch_notifications_propertyId" ON "launch_notifications" ("propertyId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_launch_notifications_email" ON "launch_notifications" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_launch_notifications_notifiedAt" ON "launch_notifications" ("notifiedAt")
    `);

    // Ajouter la clé étrangère vers properties
    await queryRunner.query(`
      ALTER TABLE "launch_notifications" 
      ADD CONSTRAINT "FK_launch_notifications_property" 
      FOREIGN KEY ("propertyId") 
      REFERENCES "properties"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer la clé étrangère
    await queryRunner.query(`
      ALTER TABLE "launch_notifications" DROP CONSTRAINT "FK_launch_notifications_property"
    `);

    // Supprimer les index
    await queryRunner.query(`DROP INDEX "public"."IDX_launch_notifications_notifiedAt"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_launch_notifications_email"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_launch_notifications_propertyId"`);

    // Supprimer la table
    await queryRunner.query(`DROP TABLE "launch_notifications"`);

    // Supprimer le type enum
    await queryRunner.query(`DROP TYPE "public"."launch_notifications_timing_enum"`);
  }
}


