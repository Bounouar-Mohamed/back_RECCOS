import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExtendedPropertyFields1720800000000 implements MigrationInterface {
  name = 'AddExtendedPropertyFields1720800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Informations financières
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN "rentalYield" decimal(5,2),
      ADD COLUMN "expectedROI" decimal(5,2),
      ADD COLUMN "monthlyRental" decimal(15,2),
      ADD COLUMN "serviceCharges" decimal(15,2),
      ADD COLUMN "maintenanceFees" decimal(15,2),
      ADD COLUMN "downPayment" decimal(15,2)
    `);

    // Informations techniques
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN "coolingSystem" varchar(100),
      ADD COLUMN "heatingSystem" varchar(100),
      ADD COLUMN "parkingType" varchar(100),
      ADD COLUMN "parkingSpots" integer,
      ADD COLUMN "furnishingStatus" varchar(50)
    `);

    // Sécurité
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN "securityFeatures" jsonb
    `);

    // Transport
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN "distanceToMetro" decimal(8,2),
      ADD COLUMN "distanceToAirport" decimal(8,2),
      ADD COLUMN "distanceToBeach" decimal(8,2),
      ADD COLUMN "nearbyTransport" jsonb
    `);

    // Quartier
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN "nearbySchools" jsonb,
      ADD COLUMN "nearbyHospitals" jsonb,
      ADD COLUMN "nearbyMalls" jsonb,
      ADD COLUMN "nearbyLandmarks" jsonb
    `);

    // Informations légales
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN "titleDeed" varchar(255),
      ADD COLUMN "ownershipType" varchar(100),
      ADD COLUMN "completionStatus" varchar(100),
      ADD COLUMN "handoverDate" date
    `);

    // Médias
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN "videos" jsonb,
      ADD COLUMN "virtualTourUrl" varchar(500),
      ADD COLUMN "floorPlans" jsonb,
      ADD COLUMN "documents" jsonb
    `);

    // Informations additionnelles
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN "maidRooms" integer,
      ADD COLUMN "storageRooms" integer,
      ADD COLUMN "view" varchar(100),
      ADD COLUMN "facing" varchar(50),
      ADD COLUMN "floorNumber" integer,
      ADD COLUMN "totalFloors" integer,
      ADD COLUMN "buildingName" varchar(255),
      ADD COLUMN "unitNumber" varchar(50)
    `);

    // Communauté
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN "communityAmenities" jsonb,
      ADD COLUMN "communityName" varchar(255)
    `);

    // Note: Pas de champs de contact direct
    // Le contact se fait via la plateforme

    // Disponibilité
    await queryRunner.query(`
      ALTER TABLE "properties" 
      ADD COLUMN "availabilityStatus" varchar(50),
      ADD COLUMN "listingType" varchar(50)
    `);

    // Index pour les recherches fréquentes
    await queryRunner.query(`
      CREATE INDEX "IDX_properties_rentalYield" ON "properties" ("rentalYield") WHERE "rentalYield" IS NOT NULL;
      CREATE INDEX "IDX_properties_completionStatus" ON "properties" ("completionStatus");
      CREATE INDEX "IDX_properties_listingType" ON "properties" ("listingType");
      CREATE INDEX "IDX_properties_availabilityStatus" ON "properties" ("availabilityStatus");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_availabilityStatus"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_listingType"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_completionStatus"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_rentalYield"`);

    await queryRunner.query(`
      ALTER TABLE "properties" 
      DROP COLUMN IF EXISTS "listingType",
      DROP COLUMN IF EXISTS "availabilityStatus",
      DROP COLUMN IF EXISTS "contactName",
      DROP COLUMN IF EXISTS "contactEmail",
      DROP COLUMN IF EXISTS "contactPhone",
      DROP COLUMN IF EXISTS "communityName",
      DROP COLUMN IF EXISTS "communityAmenities",
      DROP COLUMN IF EXISTS "unitNumber",
      DROP COLUMN IF EXISTS "buildingName",
      DROP COLUMN IF EXISTS "totalFloors",
      DROP COLUMN IF EXISTS "floorNumber",
      DROP COLUMN IF EXISTS "facing",
      DROP COLUMN IF EXISTS "view",
      DROP COLUMN IF EXISTS "storageRooms",
      DROP COLUMN IF EXISTS "maidRooms",
      DROP COLUMN IF EXISTS "documents",
      DROP COLUMN IF EXISTS "floorPlans",
      DROP COLUMN IF EXISTS "virtualTourUrl",
      DROP COLUMN IF EXISTS "videos",
      DROP COLUMN IF EXISTS "handoverDate",
      DROP COLUMN IF EXISTS "completionStatus",
      DROP COLUMN IF EXISTS "ownershipType",
      DROP COLUMN IF EXISTS "titleDeed",
      DROP COLUMN IF EXISTS "nearbyLandmarks",
      DROP COLUMN IF EXISTS "nearbyMalls",
      DROP COLUMN IF EXISTS "nearbyHospitals",
      DROP COLUMN IF EXISTS "nearbySchools",
      DROP COLUMN IF EXISTS "nearbyTransport",
      DROP COLUMN IF EXISTS "distanceToBeach",
      DROP COLUMN IF EXISTS "distanceToAirport",
      DROP COLUMN IF EXISTS "distanceToMetro",
      DROP COLUMN IF EXISTS "securityFeatures",
      DROP COLUMN IF EXISTS "furnishingStatus",
      DROP COLUMN IF EXISTS "parkingSpots",
      DROP COLUMN IF EXISTS "parkingType",
      DROP COLUMN IF EXISTS "heatingSystem",
      DROP COLUMN IF EXISTS "coolingSystem",
      DROP COLUMN IF EXISTS "downPayment",
      DROP COLUMN IF EXISTS "maintenanceFees",
      DROP COLUMN IF EXISTS "serviceCharges",
      DROP COLUMN IF EXISTS "monthlyRental",
      DROP COLUMN IF EXISTS "expectedROI",
      DROP COLUMN IF EXISTS "rentalYield"
    `);
  }
}

