import { Property } from '../../../database/entities/property.entity';
import { User } from '../../../database/entities/user.entity';

/**
 * Informations du DEVELOPER visibles par le CLIENT
 * (sans informations de contact directes)
 */
export class DeveloperInfoDto {
  id: string;
  username: string;
  firstName: string | null;
  lastName: string | null;
  // Note: email, phone, etc. ne sont PAS inclus
  // Le contact se fait via la plateforme
}

/**
 * Réponse d'une propriété avec informations du DEVELOPER filtrées
 */
export class PropertyResponseDto {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  emirate: string;
  zone: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  pricePerShare: number;
  totalShares: number;
  soldShares: number;
  totalArea: number;
  builtArea: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  features: string[] | null;
  images: string[] | null;
  mainImage: string | null;
  yearBuilt: number | null;
  status: string;
  publishedAt: Date | null;
  rejectionReason: string | null;
  
  // Informations financières
  rentalYield: number | null;
  expectedROI: number | null;
  monthlyRental: number | null;
  serviceCharges: number | null;
  maintenanceFees: number | null;
  downPayment: number | null;
  
  // Informations techniques
  coolingSystem: string | null;
  heatingSystem: string | null;
  parkingType: string | null;
  parkingSpots: number | null;
  furnishingStatus: string | null;
  
  // Sécurité
  securityFeatures: string[] | null;
  
  // Transport
  distanceToMetro: number | null;
  distanceToAirport: number | null;
  distanceToBeach: number | null;
  nearbyTransport: string[] | null;
  
  // Quartier
  nearbySchools: string[] | null;
  nearbyHospitals: string[] | null;
  nearbyMalls: string[] | null;
  nearbyLandmarks: string[] | null;
  
  // Informations légales
  titleDeed: string | null;
  ownershipType: string | null;
  completionStatus: string | null;
  handoverDate: Date | null;
  
  // Médias
  videos: string[] | null;
  virtualTourUrl: string | null;
  floorPlans: string[] | null;
  documents: string[] | null;
  
  // Informations additionnelles
  maidRooms: number | null;
  storageRooms: number | null;
  view: string | null;
  facing: string | null;
  floorNumber: number | null;
  totalFloors: number | null;
  buildingName: string | null;
  unitNumber: string | null;
  
  // Communauté
  communityAmenities: string[] | null;
  communityName: string | null;
  
  // DEVELOPER (sans contact)
  developer: DeveloperInfoDto | null;
  
  // ADMIN qui a publié (sans contact)
  publishedBy: DeveloperInfoDto | null;
  
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Fonction helper pour transformer une Property en PropertyResponseDto
 */
export function toPropertyResponseDto(property: Property): PropertyResponseDto {
  const developerInfo = property.developer
    ? {
        id: property.developer.id,
        username: property.developer.username,
        firstName: property.developer.firstName,
        lastName: property.developer.lastName,
      }
    : null;

  const publishedByInfo = property.publishedBy
    ? {
        id: property.publishedBy.id,
        username: property.publishedBy.username,
        firstName: property.publishedBy.firstName,
        lastName: property.publishedBy.lastName,
      }
    : null;

  return {
    id: property.id,
    title: property.title,
    description: property.description,
    propertyType: property.propertyType,
    emirate: property.emirate,
    zone: property.zone,
    address: property.address,
    latitude: property.latitude ? Number(property.latitude) : null,
    longitude: property.longitude ? Number(property.longitude) : null,
    pricePerShare: Number(property.pricePerShare),
    totalShares: property.totalShares,
    soldShares: property.soldShares,
    totalArea: Number(property.totalArea),
    builtArea: property.builtArea ? Number(property.builtArea) : null,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    features: property.features,
    images: property.images,
    mainImage: property.mainImage,
    yearBuilt: property.yearBuilt,
    status: property.status,
    publishedAt: property.publishedAt,
    rejectionReason: property.rejectionReason,
    rentalYield: property.rentalYield ? Number(property.rentalYield) : null,
    expectedROI: property.expectedROI ? Number(property.expectedROI) : null,
    monthlyRental: property.monthlyRental ? Number(property.monthlyRental) : null,
    serviceCharges: property.serviceCharges ? Number(property.serviceCharges) : null,
    maintenanceFees: property.maintenanceFees ? Number(property.maintenanceFees) : null,
    downPayment: property.downPayment ? Number(property.downPayment) : null,
    coolingSystem: property.coolingSystem,
    heatingSystem: property.heatingSystem,
    parkingType: property.parkingType,
    parkingSpots: property.parkingSpots,
    furnishingStatus: property.furnishingStatus,
    securityFeatures: property.securityFeatures,
    distanceToMetro: property.distanceToMetro ? Number(property.distanceToMetro) : null,
    distanceToAirport: property.distanceToAirport ? Number(property.distanceToAirport) : null,
    distanceToBeach: property.distanceToBeach ? Number(property.distanceToBeach) : null,
    nearbyTransport: property.nearbyTransport,
    nearbySchools: property.nearbySchools,
    nearbyHospitals: property.nearbyHospitals,
    nearbyMalls: property.nearbyMalls,
    nearbyLandmarks: property.nearbyLandmarks,
    titleDeed: property.titleDeed,
    ownershipType: property.ownershipType,
    completionStatus: property.completionStatus,
    handoverDate: property.handoverDate,
    videos: property.videos,
    virtualTourUrl: property.virtualTourUrl,
    floorPlans: property.floorPlans,
    documents: property.documents,
    maidRooms: property.maidRooms,
    storageRooms: property.storageRooms,
    view: property.view,
    facing: property.facing,
    floorNumber: property.floorNumber,
    totalFloors: property.totalFloors,
    buildingName: property.buildingName,
    unitNumber: property.unitNumber,
    communityAmenities: property.communityAmenities,
    communityName: property.communityName,
    developer: developerInfo,
    publishedBy: publishedByInfo,
    createdAt: property.createdAt,
    updatedAt: property.updatedAt,
  };
}
















