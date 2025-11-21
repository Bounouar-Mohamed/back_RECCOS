import { MigrationInterface, QueryRunner } from 'typeorm';

export class Add2FAFields1721200000000 implements MigrationInterface {
  name = 'Add2FAFields1721200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "twoFactorEnabled" boolean DEFAULT false,
      ADD COLUMN "twoFactorSecret" varchar(255),
      ADD COLUMN "twoFactorMethod" varchar(20),
      ADD COLUMN "phoneNumber" varchar(50),
      ADD COLUMN "phoneVerified" boolean DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "phoneVerified",
      DROP COLUMN IF EXISTS "phoneNumber",
      DROP COLUMN IF EXISTS "twoFactorMethod",
      DROP COLUMN IF EXISTS "twoFactorSecret",
      DROP COLUMN IF EXISTS "twoFactorEnabled"
    `);
  }
}
















