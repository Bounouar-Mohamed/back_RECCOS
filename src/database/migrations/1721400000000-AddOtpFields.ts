import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOtpFields1721400000000 implements MigrationInterface {
  name = 'AddOtpFields1721400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "otpCode" varchar(255),
      ADD COLUMN "otpExpiresAt" timestamp
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN IF EXISTS "otpExpiresAt",
      DROP COLUMN IF EXISTS "otpCode"
    `);
  }
}

