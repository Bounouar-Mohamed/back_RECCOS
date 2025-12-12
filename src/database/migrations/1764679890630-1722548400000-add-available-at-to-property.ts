import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAvailableAtToProperty1764679890630 implements MigrationInterface {
  name = 'AddAvailableAtToProperty1764679890630';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "properties" ADD COLUMN "availableAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "availableAt"`);
  }
}
