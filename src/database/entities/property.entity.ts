import { Entity, Column, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

/**
 * Statut d'une annonce immobilière
 */
export enum PropertyStatus {
  DRAFT = 'draft',           // Brouillon (créé par DEVELOPER)
  PENDING = 'pending',      // En attente de validation (ADMIN)
  PUBLISHED = 'published',  // Publiée et visible (CLIENT)
  SOLD = 'sold',            // Vendue (tous les tokens achetés)
  REJECTED = 'rejected',    // Rejetée par l'admin
  ARCHIVED = 'archived',    // Archivée
}

/**
 * Émirats des Émirats Arabes Unis
 */
export enum Emirates {
  DUBAI = 'dubai',
  ABU_DHABI = 'abu_dhabi',
  SHARJAH = 'sharjah',
  AJMAN = 'ajman',
  UMM_AL_QUWAIN = 'umm_al_quwain',
  RAS_AL_KHAIMAH = 'ras_al_khaimah',
  FUJAIRAH = 'fujairah',
}

/**
 * Type de propriété
 */
export enum PropertyType {
  APARTMENT = 'apartment',
  VILLA = 'villa',
  TOWNHOUSE = 'townhouse',
  PENTHOUSE = 'penthouse',
  STUDIO = 'studio',
  LAND = 'land',
  COMMERCIAL = 'commercial',
}

@Entity('properties')
@Index(['status'])
@Index(['emirate'])
@Index(['developerId'])
@Index(['status', 'emirate']) // Index composite pour les recherches
export class Property extends BaseEntity {
  /**
   * Développeur qui a créé l'annonce
   */
  @ManyToOne(() => User)
  @JoinColumn({ name: 'developerId' })
  developer: User;

  @Column({ type: 'uuid' })
  developerId: string;

  /**
   * Titre de l'annonce
   * Ex: "Infinity pool in Dubai"
   */
  @Column({ type: 'varchar', length: 255 })
  title: string;

  /**
   * Description détaillée
   */
  @Column({ type: 'text' })
  description: string;

  /**
   * Type de propriété
   */
  @Column({ type: 'enum', enum: PropertyType })
  propertyType: PropertyType;

  /**
   * Émirat
   */
  @Column({ type: 'enum', enum: Emirates })
  emirate: Emirates;

  /**
   * Zone/Quartier
   * Ex: "Downtown Dubai", "Palm Jumeirah", "Dubai Marina"
   */
  @Column({ type: 'varchar', length: 255 })
  zone: string;

  /**
   * Adresse complète
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string;

  /**
   * Coordonnées GPS (latitude)
   */
  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  /**
   * Coordonnées GPS (longitude)
   */
  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  /**
   * Prix par token/share (en AED)
   * Ex: 7200
   */
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  pricePerShare: number;

  /**
   * Nombre total de shares/tokens disponibles
   * Ex: 500
   */
  @Column({ type: 'integer' })
  totalShares: number;

  /**
   * Nombre de shares/tokens vendus
   */
  @Column({ type: 'integer', default: 0 })
  soldShares: number;

  /**
   * Superficie totale (en sqft)
   * Ex: 12800
   */
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  totalArea: number;

  /**
   * Superficie construite (en sqft)
   */
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  builtArea: number;

  /**
   * Nombre de chambres
   * Ex: 6
   */
  @Column({ type: 'integer', nullable: true })
  bedrooms: number;

  /**
   * Nombre de salles de bain
   * Ex: 8
   */
  @Column({ type: 'integer', nullable: true })
  bathrooms: number;

  /**
   * Caractéristiques spéciales (JSON)
   * Ex: ["Private Beach Access", "Infinity Pool", "Gym", "Parking"]
   */
  @Column({ type: 'jsonb', nullable: true })
  features: string[];

  /**
   * Images de la propriété (URLs)
   */
  @Column({ type: 'jsonb', nullable: true })
  images: string[];

  /**
   * Image principale (URL)
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  mainImage: string;

  /**
   * Année de construction
   */
  @Column({ type: 'integer', nullable: true })
  yearBuilt: number;

  /**
   * Statut de l'annonce
   */
  @Column({
    type: 'enum',
    enum: PropertyStatus,
    default: PropertyStatus.DRAFT,
  })
  status: PropertyStatus;

  /**
   * Date de publication (quand l'admin publie)
   */
  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  /**
   * Admin qui a publié l'annonce
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'publishedById' })
  publishedBy: User;

  @Column({ type: 'uuid', nullable: true })
  publishedById: string;

  /**
   * Raison de rejet (si status = REJECTED)
   */
  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  /**
   * Métadonnées additionnelles (JSON)
   * Ex: { "parkingSpots": 2, "balcony": true, "furnished": false }
   */
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  // ========== INFORMATIONS FINANCIÈRES ==========
  /**
   * Rendement locatif annuel en %
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  rentalYield: number;

  /**
   * ROI attendu en %
   */
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  expectedROI: number;

  /**
   * Loyer mensuel estimé en AED
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  monthlyRental: number;

  /**
   * Charges de service annuelles en AED
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  serviceCharges: number;

  /**
   * Frais de maintenance annuels en AED
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  maintenanceFees: number;

  /**
   * Acompte requis en AED
   */
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  downPayment: number;

  // ========== INFORMATIONS TECHNIQUES ==========
  /**
   * Système de climatisation
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  coolingSystem: string;

  /**
   * Système de chauffage
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  heatingSystem: string;

  /**
   * Type de parking
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  parkingType: string;

  /**
   * Nombre de places de parking
   */
  @Column({ type: 'integer', nullable: true })
  parkingSpots: number;

  /**
   * Statut d'ameublement
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  furnishingStatus: string;

  // ========== SÉCURITÉ ==========
  /**
   * Caractéristiques de sécurité
   */
  @Column({ type: 'jsonb', nullable: true })
  securityFeatures: string[];

  // ========== TRANSPORT ==========
  /**
   * Distance au métro en km
   */
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distanceToMetro: number;

  /**
   * Distance à l'aéroport en km
   */
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distanceToAirport: number;

  /**
   * Distance à la plage en km
   */
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distanceToBeach: number;

  /**
   * Transports à proximité
   */
  @Column({ type: 'jsonb', nullable: true })
  nearbyTransport: string[];

  // ========== QUARTIER ==========
  /**
   * Écoles à proximité
   */
  @Column({ type: 'jsonb', nullable: true })
  nearbySchools: string[];

  /**
   * Hôpitaux à proximité
   */
  @Column({ type: 'jsonb', nullable: true })
  nearbyHospitals: string[];

  /**
   * Centres commerciaux à proximité
   */
  @Column({ type: 'jsonb', nullable: true })
  nearbyMalls: string[];

  /**
   * Points d'intérêt à proximité
   */
  @Column({ type: 'jsonb', nullable: true })
  nearbyLandmarks: string[];

  // ========== INFORMATIONS LÉGALES ==========
  /**
   * Numéro du titre de propriété
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  titleDeed: string;

  /**
   * Type de propriété (Freehold, Leasehold, etc.)
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  ownershipType: string;

  /**
   * Statut de complétion
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  completionStatus: string;

  /**
   * Date de livraison
   */
  @Column({ type: 'date', nullable: true })
  handoverDate: Date;

  // ========== MÉDIAS ==========
  /**
   * URLs des vidéos
   */
  @Column({ type: 'jsonb', nullable: true })
  videos: string[];

  /**
   * URL du virtual tour (360°, Matterport, etc.)
   */
  @Column({ type: 'varchar', length: 500, nullable: true })
  virtualTourUrl: string;

  /**
   * URLs des plans d'étage
   */
  @Column({ type: 'jsonb', nullable: true })
  floorPlans: string[];

  /**
   * URLs des documents (brochures, etc.)
   */
  @Column({ type: 'jsonb', nullable: true })
  documents: string[];

  // ========== INFORMATIONS ADDITIONNELLES ==========
  /**
   * Nombre de chambres de bonne
   */
  @Column({ type: 'integer', nullable: true })
  maidRooms: number;

  /**
   * Nombre de salles de stockage
   */
  @Column({ type: 'integer', nullable: true })
  storageRooms: number;

  /**
   * Vue (Sea View, City View, Garden View, etc.)
   */
  @Column({ type: 'varchar', length: 100, nullable: true })
  view: string;

  /**
   * Orientation (North, South, East, West)
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  facing: string;

  /**
   * Numéro d'étage
   */
  @Column({ type: 'integer', nullable: true })
  floorNumber: number;

  /**
   * Nombre total d'étages dans le bâtiment
   */
  @Column({ type: 'integer', nullable: true })
  totalFloors: number;

  /**
   * Nom du bâtiment
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  buildingName: string;

  /**
   * Numéro d'unité
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  unitNumber: string;

  // ========== COMMUNAUTÉ ==========
  /**
   * Équipements de la communauté
   */
  @Column({ type: 'jsonb', nullable: true })
  communityAmenities: string[];

  /**
   * Nom de la communauté
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  communityName: string;

  // Note: Les informations de contact ne sont PAS stockées ici
  // Le CLIENT voit les informations du DEVELOPER mais doit passer par la plateforme pour le contacter
  // Les demandes de contact sont gérées via un système de messages/demandes séparé

  // ========== DISPONIBILITÉ ==========
  /**
   * Statut de disponibilité
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  availabilityStatus: string;

  /**
   * Type d'annonce (Sale, Rent, Both)
   */
  @Column({ type: 'varchar', length: 50, nullable: true })
  listingType: string;

  /**
   * Calculé : Pourcentage de tokens vendus
   */
  get soldPercentage(): number {
    if (this.totalShares === 0) return 0;
    return (this.soldShares / this.totalShares) * 100;
  }

  /**
   * Calculé : Nombre de tokens disponibles
   */
  get availableShares(): number {
    return this.totalShares - this.soldShares;
  }

  /**
   * Calculé : Valeur totale de la propriété
   */
  get totalValue(): number {
    return Number(this.pricePerShare) * this.totalShares;
  }
}

