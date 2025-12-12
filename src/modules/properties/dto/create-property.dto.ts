import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  IsUrl,
  Min,
  Max,
  ValidateNested,
  IsObject,
  IsDateString,
  Matches,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
  registerDecorator,
  ValidationOptions,
  IsUUID,
} from 'class-validator';

// Custom validator for URLs or data URLs (base64)
@ValidatorConstraint({ name: 'isUrlOrDataUrl', async: false })
class IsUrlOrDataUrlConstraint implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    if (!value || typeof value !== 'string') return false;
    // Accept data URLs (base64)
    if (value.startsWith('data:')) return true;
    // Accept standard URLs
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'Each value must be a valid URL or data URL';
  }
}

function IsUrlOrDataUrl(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUrlOrDataUrlConstraint,
    });
  };
}
import { Type } from 'class-transformer';
import { PropertyType, Emirates, PropertyStatus } from '../../../database/entities/property.entity';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(PropertyType)
  propertyType: PropertyType;

  @IsEnum(Emirates)
  emirate: Emirates;

  @IsString()
  @IsNotEmpty()
  zone: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  pricePerShare: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  totalShares: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  totalArea: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  builtArea?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bedrooms?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  bathrooms?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @IsArray()
  @IsString({ each: true })
  @Validate(IsUrlOrDataUrlConstraint, { each: true })
  @IsOptional()
  images?: string[];

  @IsString()
  @IsUrlOrDataUrl()
  @IsOptional()
  mainImage?: string;

  @IsNumber()
  @IsOptional()
  @Min(1900)
  @Max(2100)
  yearBuilt?: number;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  // Champs additionnels pour être compétitif
  @IsString()
  @IsOptional()
  developerId?: string; // Pour ADMIN qui crée pour un DEVELOPER

  @IsUUID()
  @IsOptional()
  brandDeveloperId?: string;

  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus; // Pour ADMIN qui peut créer directement en PENDING

  // Informations financières
  @IsNumber()
  @IsOptional()
  @Min(0)
  rentalYield?: number; // Rendement locatif annuel en %

  @IsNumber()
  @IsOptional()
  @Min(0)
  expectedROI?: number; // ROI attendu en %

  @IsNumber()
  @IsOptional()
  @Min(0)
  monthlyRental?: number; // Loyer mensuel estimé en AED

  @IsNumber()
  @IsOptional()
  @Min(0)
  serviceCharges?: number; // Charges de service annuelles en AED

  @IsNumber()
  @IsOptional()
  @Min(0)
  maintenanceFees?: number; // Frais de maintenance annuels en AED

  @IsNumber()
  @IsOptional()
  @Min(0)
  downPayment?: number; // Acompte requis en AED

  // Informations techniques
  @IsString()
  @IsOptional()
  coolingSystem?: string; // AC Central, Split, Chiller, etc.

  @IsString()
  @IsOptional()
  heatingSystem?: string;

  @IsString()
  @IsOptional()
  parkingType?: string; // Covered, Open, Valet, etc.

  @IsNumber()
  @IsOptional()
  @Min(0)
  parkingSpots?: number;

  @IsString()
  @IsOptional()
  furnishingStatus?: string; // Furnished, Semi-Furnished, Unfurnished

  // Informations de sécurité
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  securityFeatures?: string[]; // CCTV, Security Guard, Access Control, etc.

  // Informations de transport
  @IsNumber()
  @IsOptional()
  @Min(0)
  distanceToMetro?: number; // Distance au métro en km

  @IsNumber()
  @IsOptional()
  @Min(0)
  distanceToAirport?: number; // Distance à l'aéroport en km

  @IsNumber()
  @IsOptional()
  @Min(0)
  distanceToBeach?: number; // Distance à la plage en km

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nearbyTransport?: string[]; // Metro stations, Bus stops, etc.

  // Informations de quartier
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nearbySchools?: string[]; // Noms des écoles à proximité

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nearbyHospitals?: string[]; // Noms des hôpitaux à proximité

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nearbyMalls?: string[]; // Noms des centres commerciaux

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  nearbyLandmarks?: string[]; // Points d'intérêt

  // Informations légales
  @IsString()
  @IsOptional()
  titleDeed?: string; // Numéro du titre de propriété

  @IsString()
  @IsOptional()
  ownershipType?: string; // Freehold, Leasehold, etc.

  @IsString()
  @IsOptional()
  completionStatus?: string; // Ready, Off-Plan, Under Construction

  @IsString()
  @IsOptional()
  handoverDate?: string; // Date de livraison (ISO format)

  // Médias additionnels
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  videos?: string[]; // URLs des vidéos

  @IsUrl()
  @IsOptional()
  virtualTourUrl?: string; // URL du virtual tour (360°, Matterport, etc.)

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  floorPlans?: string[]; // URLs des plans d'étage

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  documents?: string[]; // URLs des documents (brochures, etc.)

  // Informations additionnelles
  @IsNumber()
  @IsOptional()
  @Min(0)
  maidRooms?: number; // Nombre de chambres de bonne

  @IsNumber()
  @IsOptional()
  @Min(0)
  storageRooms?: number; // Nombre de salles de stockage

  @IsString()
  @IsOptional()
  view?: string; // Sea View, City View, Garden View, etc.

  @IsString()
  @IsOptional()
  facing?: string; // Direction (North, South, East, West)

  @IsNumber()
  @IsOptional()
  @Min(0)
  floorNumber?: number; // Numéro d'étage

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalFloors?: number; // Nombre total d'étages dans le bâtiment

  @IsString()
  @IsOptional()
  buildingName?: string; // Nom du bâtiment

  @IsString()
  @IsOptional()
  unitNumber?: string; // Numéro d'unité

  // Informations de communauté
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  communityAmenities?: string[]; // Gym, Pool, Kids Play Area, etc.

  @IsString()
  @IsOptional()
  communityName?: string; // Nom de la communauté

  // Note: Les informations de contact ne sont PAS gérées ici
  // Le contact se fait via la plateforme, pas directement avec le DEVELOPER

  // Informations de disponibilité
  @IsString()
  @IsOptional()
  availabilityStatus?: string; // Available, Reserved, Sold Out

  @IsString()
  @IsOptional()
  listingType?: string; // Sale, Rent, Both

  @IsOptional()
  availableAt?: string | null; // Date ISO d'ouverture des ventes (peut être null pour supprimer)
}

