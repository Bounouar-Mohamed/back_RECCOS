import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeveloperBrands1765000002000 implements MigrationInterface {
  name = 'CreateDeveloperBrands1765000002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "developer_brands" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(255) NOT NULL,
        "logoUrl" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_developer_brands_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_developer_brands_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD "brandDeveloperId" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      ADD CONSTRAINT "FK_properties_brandDeveloper"
      FOREIGN KEY ("brandDeveloperId") REFERENCES "developer_brands"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP CONSTRAINT "FK_properties_brandDeveloper"
    `);

    await queryRunner.query(`
      ALTER TABLE "properties"
      DROP COLUMN "brandDeveloperId"
    `);

    await queryRunner.query(`
      DROP TABLE "developer_brands"
    `);
  }
}


