import { MigrationInterface, QueryRunner } from 'typeorm';

const NEW_ENUM = `'draft', 'pending', 'upcoming', 'published', 'sold', 'rejected', 'archived'`;
const OLD_ENUM = `'draft', 'pending', 'published', 'sold', 'rejected', 'archived'`;

export class AddUpcomingStatusToProperty1767000004000 implements MigrationInterface {
  name = 'AddUpcomingStatusToProperty1767000004000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "property_status_enum_new" AS ENUM (${NEW_ENUM})`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ALTER COLUMN "status" TYPE "property_status_enum_new" USING "status"::text::"property_status_enum_new"`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ALTER COLUMN "status" SET DEFAULT 'draft'`,
    );
    await queryRunner.query(`DROP TYPE "property_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "property_status_enum_new" RENAME TO "property_status_enum"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "property_status_enum_old" AS ENUM (${OLD_ENUM})`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `UPDATE "properties" SET "status" = 'draft' WHERE "status" = 'upcoming'`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ALTER COLUMN "status" TYPE "property_status_enum_old" USING "status"::text::"property_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "properties" ALTER COLUMN "status" SET DEFAULT 'draft'`,
    );
    await queryRunner.query(`DROP TYPE "property_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "property_status_enum_old" RENAME TO "property_status_enum"`,
    );
  }
}


