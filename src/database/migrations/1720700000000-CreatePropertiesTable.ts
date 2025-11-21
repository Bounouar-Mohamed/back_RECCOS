import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreatePropertiesTable1720700000000 implements MigrationInterface {
  name = 'CreatePropertiesTable1720700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer les types enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "property_status_enum" AS ENUM ('draft', 'pending', 'published', 'sold', 'rejected', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "emirates_enum" AS ENUM ('dubai', 'abu_dhabi', 'sharjah', 'ajman', 'umm_al_quwain', 'ras_al_khaimah', 'fujairah');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "property_type_enum" AS ENUM ('apartment', 'villa', 'townhouse', 'penthouse', 'studio', 'land', 'commercial');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'properties',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'developerId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'propertyType',
            type: 'property_type_enum',
            isNullable: false,
          },
          {
            name: 'emirate',
            type: 'emirates_enum',
            isNullable: false,
          },
          {
            name: 'zone',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'address',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'latitude',
            type: 'decimal',
            precision: 10,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'longitude',
            type: 'decimal',
            precision: 11,
            scale: 8,
            isNullable: true,
          },
          {
            name: 'pricePerShare',
            type: 'decimal',
            precision: 15,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'totalShares',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'soldShares',
            type: 'integer',
            default: 0,
          },
          {
            name: 'totalArea',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'builtArea',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'bedrooms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'bathrooms',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'features',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'images',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'mainImage',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'yearBuilt',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'property_status_enum',
            default: "'draft'",
          },
          {
            name: 'publishedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'publishedById',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'rejectionReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Créer les index
    await queryRunner.createIndex(
      'properties',
      new TableIndex({
        name: 'IDX_properties_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'properties',
      new TableIndex({
        name: 'IDX_properties_emirate',
        columnNames: ['emirate'],
      }),
    );

    await queryRunner.createIndex(
      'properties',
      new TableIndex({
        name: 'IDX_properties_developerId',
        columnNames: ['developerId'],
      }),
    );

    await queryRunner.createIndex(
      'properties',
      new TableIndex({
        name: 'IDX_properties_status_emirate',
        columnNames: ['status', 'emirate'],
      }),
    );

    // Créer les clés étrangères
    await queryRunner.createForeignKey(
      'properties',
      new TableForeignKey({
        columnNames: ['developerId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'properties',
      new TableForeignKey({
        columnNames: ['publishedById'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('properties');
    await queryRunner.query(`DROP TYPE IF EXISTS "property_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "emirates_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "property_type_enum"`);
  }
}
















