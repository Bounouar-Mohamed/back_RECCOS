import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_NAME = 'properties';
const COLUMN_NAME = 'mainImage';

export class AlterMainImageColumn1765000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${TABLE_NAME}" ALTER COLUMN "${COLUMN_NAME}" TYPE text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "${TABLE_NAME}" ALTER COLUMN "${COLUMN_NAME}" TYPE character varying(500)`);
  }
}

