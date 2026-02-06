import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddUserProfileFields1768000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const existingColumns = table?.columns.map((col) => col.name) || [];

    // Ajouter avatarUrl si elle n'existe pas
    if (!existingColumns.includes('avatarUrl')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'avatarUrl',
          type: 'text',
          isNullable: true,
        }),
      );
    }

    // Ajouter les champs bancaires s'ils n'existent pas
    if (!existingColumns.includes('bankAccountHolder')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'bankAccountHolder',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    if (!existingColumns.includes('bankName')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'bankName',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );
    }

    if (!existingColumns.includes('iban')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'iban',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }),
      );
    }

    if (!existingColumns.includes('swiftCode')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'swiftCode',
          type: 'varchar',
          length: '20',
          isNullable: true,
        }),
      );
    }

    if (!existingColumns.includes('payoutMethod')) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'payoutMethod',
          type: 'varchar',
          length: '50',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const existingColumns = table?.columns.map((col) => col.name) || [];

    if (existingColumns.includes('payoutMethod')) {
      await queryRunner.dropColumn('users', 'payoutMethod');
    }
    if (existingColumns.includes('swiftCode')) {
      await queryRunner.dropColumn('users', 'swiftCode');
    }
    if (existingColumns.includes('iban')) {
      await queryRunner.dropColumn('users', 'iban');
    }
    if (existingColumns.includes('bankName')) {
      await queryRunner.dropColumn('users', 'bankName');
    }
    if (existingColumns.includes('bankAccountHolder')) {
      await queryRunner.dropColumn('users', 'bankAccountHolder');
    }
    if (existingColumns.includes('avatarUrl')) {
      await queryRunner.dropColumn('users', 'avatarUrl');
    }
  }
}



