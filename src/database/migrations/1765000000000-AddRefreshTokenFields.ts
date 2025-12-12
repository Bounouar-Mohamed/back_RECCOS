import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

const TABLE_NAME = 'users';
const INDEX_NAME = 'IDX_users_refresh_token_hash';

export class AddRefreshTokenFields1765000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns(TABLE_NAME, [
      new TableColumn({
        name: 'refreshTokenHash',
        type: 'varchar',
        length: '512',
        isNullable: true,
      }),
      new TableColumn({
        name: 'refreshTokenExpiresAt',
        type: 'timestamp',
        isNullable: true,
      }),
      new TableColumn({
        name: 'lastHeartbeatAt',
        type: 'timestamp',
        isNullable: true,
      }),
    ]);

    await queryRunner.createIndex(
      TABLE_NAME,
      new TableIndex({
        name: INDEX_NAME,
        columnNames: ['refreshTokenHash'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex(TABLE_NAME, INDEX_NAME);
    await queryRunner.dropColumn(TABLE_NAME, 'lastHeartbeatAt');
    await queryRunner.dropColumn(TABLE_NAME, 'refreshTokenExpiresAt');
    await queryRunner.dropColumn(TABLE_NAME, 'refreshTokenHash');
  }
}


