/**
 * Seed Script - Crée 20 propriétés Dubai réalistes
 *
 * Usage: npx ts-node src/database/seeds/seed-properties.ts
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

// Load env
config({ path: resolve(__dirname, '../../../.env') });

import { Property, PropertyStatus, PropertyType, Emirates } from '../entities/property.entity';
import { User } from '../entities/user.entity';
import { DeveloperBrand } from '../entities/developer-brand.entity';
import { UserRole } from '../../common/enums/user-role.enum';

// Create data source
const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'all4one',
  entities: [Property, User, DeveloperBrand],
  synchronize: false,
  logging: false,
});

// ═══════════════════════════════════════════════════════════════════════════════
// DUBAI DEVELOPERS
// ═══════════════════════════════════════════════════════════════════════════════
const DEVELOPERS = [
  { name: 'Emaar Properties', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Emaar_Properties_logo.svg/200px-Emaar_Properties_logo.svg.png' },
  { name: 'DAMAC Properties', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/DAMAC_Properties_Logo.svg/200px-DAMAC_Properties_Logo.svg.png' },
  { name: 'Nakheel', logo: 'https://www.nakheel.com/images/nakheel-logo.svg' },
  { name: 'Sobha Realty', logo: 'https://www.sobharealty.com/images/sobha-logo.svg' },
  { name: 'Meraas', logo: 'https://www.meraas.com/images/meraas-logo.svg' },
  { name: 'Dubai Properties', logo: 'https://www.dp.ae/images/dp-logo.svg' },
  { name: 'Azizi Developments', logo: 'https://www.azizidevelopments.com/images/azizi-logo.svg' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 20 PROPRIÉTÉS DUBAI RÉALISTES
// ═══════════════════════════════════════════════════════════════════════════════
const PROPERTIES_DATA = [
  // 1. UPCOMING - Coming Soon (Emaar Beachfront)
  {
    title: 'Seapoint Tower - Exclusive Waterfront Living',
    description: 'Découvrez le summum du luxe balnéaire à Emaar Beachfront. Seapoint Tower offre des résidences exceptionnelles avec vue panoramique sur le golfe Persique. Accès direct à la plage privée, piscine à débordement et services de conciergerie 5 étoiles.',
    propertyType: PropertyType.APARTMENT,
    emirate: Emirates.DUBAI,
    zone: 'Emaar Beachfront',
    address: 'Seapoint Tower, Emaar Beachfront, Dubai',
    latitude: 25.0847,
    longitude: 55.1326,
    pricePerShare: 8500,
    totalShares: 500,
    soldShares: 0,
    totalArea: 2100,
    builtArea: 1850,
    bedrooms: 3,
    bathrooms: 4,
    features: ['Private Beach Access', 'Infinity Pool', 'Smart Home', 'Concierge Service', 'Gym', 'Spa', 'Underground Parking'],
    yearBuilt: 2026,
    status: PropertyStatus.UPCOMING,
    rentalYield: 7.2,
    expectedROI: 12.5,
    monthlyRental: 28000,
    serviceCharges: 35000,
    view: 'Full Sea View',
    floorNumber: 28,
    totalFloors: 45,
    buildingName: 'Seapoint Tower',
    developer: 'Emaar Properties',
    ownershipType: 'Freehold',
    completionStatus: 'Off-Plan',
    handoverDate: '2026-06-15',
    availableAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    distanceToBeach: 0.05,
    distanceToMetro: 2.5,
    communityAmenities: ['Beach Club', 'Restaurants', 'Retail', 'Water Sports'],
  },

  // 2-20: PUBLISHED - Ready to Invest
  {
    title: 'Marina Skyline Penthouse',
    description: 'Penthouse spectaculaire dans le cœur de Dubai Marina. Vue à 360° sur la marina, le Palm et le skyline de Dubai. Finitions ultra-premium, piscine privée sur le toit.',
    propertyType: PropertyType.PENTHOUSE,
    emirate: Emirates.DUBAI,
    zone: 'Dubai Marina',
    address: 'Marina Pinnacle, Dubai Marina, Dubai',
    latitude: 25.0777,
    longitude: 55.1380,
    pricePerShare: 15000,
    totalShares: 800,
    soldShares: 234,
    totalArea: 5500,
    builtArea: 4800,
    bedrooms: 5,
    bathrooms: 7,
    features: ['Private Pool', 'Private Elevator', 'Smart Home', 'Wine Cellar', 'Home Cinema', 'Rooftop Terrace'],
    yearBuilt: 2022,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 6.5,
    expectedROI: 11.0,
    monthlyRental: 85000,
    serviceCharges: 95000,
    view: 'Full Marina & Palm View',
    floorNumber: 55,
    totalFloors: 55,
    buildingName: 'Marina Pinnacle',
    developer: 'Emaar Properties',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    distanceToBeach: 0.8,
    distanceToMetro: 0.3,
  },

  {
    title: 'Palm Signature Villa',
    description: 'Villa exceptionnelle sur la fronde du Palm Jumeirah avec plage privée. Architecture contemporaine signée, jardins paysagers, piscine à débordement face à la mer.',
    propertyType: PropertyType.VILLA,
    emirate: Emirates.DUBAI,
    zone: 'Palm Jumeirah',
    address: 'Frond K, Palm Jumeirah, Dubai',
    latitude: 25.1124,
    longitude: 55.1390,
    pricePerShare: 25000,
    totalShares: 1000,
    soldShares: 456,
    totalArea: 12800,
    builtArea: 9500,
    bedrooms: 7,
    bathrooms: 9,
    features: ['Private Beach', 'Infinity Pool', 'Boat Dock', 'Staff Quarters', 'Gym', 'Cinema Room', '6-Car Garage'],
    yearBuilt: 2020,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 5.8,
    expectedROI: 10.5,
    monthlyRental: 150000,
    serviceCharges: 180000,
    view: 'Sea View & Atlantis View',
    buildingName: 'Palm Signature Villas',
    developer: 'Nakheel',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    distanceToBeach: 0,
    distanceToMetro: 4.5,
  },

  {
    title: 'Downtown Boulevard Residence',
    description: 'Appartement de prestige sur le célèbre Dubai Boulevard avec vue directe sur Burj Khalifa. Emplacement premium au cœur de Downtown Dubai.',
    propertyType: PropertyType.APARTMENT,
    emirate: Emirates.DUBAI,
    zone: 'Downtown Dubai',
    address: 'Boulevard Point, Downtown Dubai',
    latitude: 25.1972,
    longitude: 55.2744,
    pricePerShare: 9200,
    totalShares: 450,
    soldShares: 189,
    totalArea: 1800,
    builtArea: 1650,
    bedrooms: 2,
    bathrooms: 3,
    features: ['Burj Khalifa View', 'Smart Home', 'Concierge', 'Gym', 'Pool', 'Valet Parking'],
    yearBuilt: 2021,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 7.0,
    expectedROI: 11.5,
    monthlyRental: 22000,
    serviceCharges: 28000,
    view: 'Burj Khalifa & Fountain View',
    floorNumber: 32,
    totalFloors: 48,
    buildingName: 'Boulevard Point',
    developer: 'Emaar Properties',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    distanceToMetro: 0.2,
  },

  {
    title: 'Business Bay Executive Suite',
    description: 'Suite exécutive dans le quartier d\'affaires de Dubai. Idéal pour investisseurs recherchant un rendement locatif élevé avec clientèle corporate.',
    propertyType: PropertyType.APARTMENT,
    emirate: Emirates.DUBAI,
    zone: 'Business Bay',
    address: 'Executive Towers, Business Bay, Dubai',
    latitude: 25.1850,
    longitude: 55.2650,
    pricePerShare: 5500,
    totalShares: 300,
    soldShares: 178,
    totalArea: 950,
    builtArea: 880,
    bedrooms: 1,
    bathrooms: 2,
    features: ['Canal View', 'Furnished', 'Gym', 'Business Center', 'Parking'],
    yearBuilt: 2019,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 8.2,
    expectedROI: 13.0,
    monthlyRental: 9500,
    serviceCharges: 12000,
    view: 'Canal View',
    floorNumber: 18,
    totalFloors: 35,
    buildingName: 'Executive Towers',
    developer: 'Dubai Properties',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    distanceToMetro: 0.5,
  },

  {
    title: 'JBR Beachfront Luxury',
    description: 'Appartement de luxe en front de mer à JBR The Walk. Accès direct à la plage, vue imprenable sur Bluewaters Island et la grande roue Ain Dubai.',
    propertyType: PropertyType.APARTMENT,
    emirate: Emirates.DUBAI,
    zone: 'Jumeirah Beach Residence',
    address: 'Shams 4, JBR, Dubai',
    latitude: 25.0780,
    longitude: 55.1340,
    pricePerShare: 7800,
    totalShares: 400,
    soldShares: 267,
    totalArea: 1600,
    builtArea: 1450,
    bedrooms: 2,
    bathrooms: 3,
    features: ['Beach Access', 'Sea View', 'Pool', 'Gym', 'The Walk Access', 'Parking'],
    yearBuilt: 2018,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 7.5,
    expectedROI: 12.0,
    monthlyRental: 18000,
    serviceCharges: 22000,
    view: 'Full Sea View & Ain Dubai',
    floorNumber: 24,
    totalFloors: 42,
    buildingName: 'Shams 4',
    developer: 'Dubai Properties',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    distanceToBeach: 0.1,
    distanceToMetro: 1.2,
  },

  {
    title: 'Bluewaters Island Penthouse',
    description: 'Penthouse exclusif sur l\'île Bluewaters avec vue directe sur Ain Dubai, la plus grande roue d\'observation au monde. Luxe absolu et emplacement unique.',
    propertyType: PropertyType.PENTHOUSE,
    emirate: Emirates.DUBAI,
    zone: 'Bluewaters Island',
    address: 'Banyan Tree Residences, Bluewaters Island',
    latitude: 25.0810,
    longitude: 55.1220,
    pricePerShare: 18000,
    totalShares: 600,
    soldShares: 145,
    totalArea: 4200,
    builtArea: 3800,
    bedrooms: 4,
    bathrooms: 5,
    features: ['Ain Dubai View', 'Private Pool', 'Smart Home', 'Hotel Services', 'Beach Club Access'],
    yearBuilt: 2021,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 6.8,
    expectedROI: 11.2,
    monthlyRental: 65000,
    serviceCharges: 75000,
    view: 'Ain Dubai & Sea View',
    floorNumber: 20,
    totalFloors: 22,
    buildingName: 'Banyan Tree Residences',
    developer: 'Meraas',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    distanceToBeach: 0.2,
  },

  {
    title: 'Creek Harbour Waterfront',
    description: 'Appartement moderne à Dubai Creek Harbour avec vue sur la future Dubai Creek Tower. Quartier en plein essor avec fort potentiel de plus-value.',
    propertyType: PropertyType.APARTMENT,
    emirate: Emirates.DUBAI,
    zone: 'Dubai Creek Harbour',
    address: 'Creek Rise, Dubai Creek Harbour',
    latitude: 25.2050,
    longitude: 55.3450,
    pricePerShare: 6200,
    totalShares: 350,
    soldShares: 98,
    totalArea: 1350,
    builtArea: 1200,
    bedrooms: 2,
    bathrooms: 2,
    features: ['Creek View', 'Smart Home', 'Pool', 'Gym', 'Kids Play Area'],
    yearBuilt: 2023,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 7.8,
    expectedROI: 14.0,
    monthlyRental: 14000,
    serviceCharges: 16000,
    view: 'Creek View',
    floorNumber: 15,
    totalFloors: 32,
    buildingName: 'Creek Rise',
    developer: 'Emaar Properties',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    distanceToMetro: 1.8,
  },

  {
    title: 'Dubai Hills Golf Course Villa',
    description: 'Villa familiale de standing dans la communauté verdoyante de Dubai Hills Estate. Vue sur le golf, proximité des écoles internationales.',
    propertyType: PropertyType.VILLA,
    emirate: Emirates.DUBAI,
    zone: 'Dubai Hills Estate',
    address: 'Golf Grove, Dubai Hills Estate',
    latitude: 25.1150,
    longitude: 55.2350,
    pricePerShare: 12000,
    totalShares: 550,
    soldShares: 312,
    totalArea: 6500,
    builtArea: 5200,
    bedrooms: 5,
    bathrooms: 6,
    features: ['Golf Course View', 'Private Garden', 'Pool', 'Maid Room', 'Driver Room', '3-Car Garage'],
    yearBuilt: 2022,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 5.5,
    expectedROI: 9.5,
    monthlyRental: 45000,
    serviceCharges: 55000,
    view: 'Golf Course View',
    buildingName: 'Golf Grove Villas',
    developer: 'Emaar Properties',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    nearbySchools: ['GEMS Wellington Academy', 'Dubai British School'],
  },

  {
    title: 'DAMAC Hills 2 Townhouse',
    description: 'Townhouse abordable dans la communauté DAMAC Hills 2. Parfait pour les familles, avec accès aux parcs, piscines et terrains de sport.',
    propertyType: PropertyType.TOWNHOUSE,
    emirate: Emirates.DUBAI,
    zone: 'DAMAC Hills 2',
    address: 'Amazonia Cluster, DAMAC Hills 2',
    latitude: 24.9950,
    longitude: 55.2650,
    pricePerShare: 3800,
    totalShares: 280,
    soldShares: 195,
    totalArea: 2200,
    builtArea: 1900,
    bedrooms: 3,
    bathrooms: 4,
    features: ['Private Garden', 'Community Pool', 'BBQ Area', 'Kids Play Area', 'Parking'],
    yearBuilt: 2023,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 8.5,
    expectedROI: 13.5,
    monthlyRental: 8500,
    serviceCharges: 10000,
    view: 'Garden View',
    buildingName: 'Amazonia Townhouses',
    developer: 'DAMAC Properties',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    communityAmenities: ['Water Park', 'Sports Courts', 'Retail Center'],
  },

  {
    title: 'City Walk Urban Living',
    description: 'Appartement design dans le quartier branché de City Walk. Au cœur de l\'action avec boutiques, restaurants et divertissement à portée de main.',
    propertyType: PropertyType.APARTMENT,
    emirate: Emirates.DUBAI,
    zone: 'City Walk',
    address: 'Building 11, City Walk, Dubai',
    latitude: 25.2080,
    longitude: 55.2620,
    pricePerShare: 8800,
    totalShares: 380,
    soldShares: 223,
    totalArea: 1550,
    builtArea: 1400,
    bedrooms: 2,
    bathrooms: 2,
    features: ['Urban View', 'Furnished', 'Smart Home', 'Gym', 'Pool', 'Retail Access'],
    yearBuilt: 2020,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 7.2,
    expectedROI: 11.8,
    monthlyRental: 17500,
    serviceCharges: 21000,
    view: 'City Walk Boulevard View',
    floorNumber: 8,
    totalFloors: 12,
    buildingName: 'City Walk Residences',
    developer: 'Meraas',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    distanceToMetro: 0.8,
  },

  {
    title: 'Arabian Ranches Family Villa',
    description: 'Villa spacieuse dans le quartier résidentiel le plus prisé des familles expatriées. Écoles, parcs et golf à proximité.',
    propertyType: PropertyType.VILLA,
    emirate: Emirates.DUBAI,
    zone: 'Arabian Ranches',
    address: 'Palma Residence, Arabian Ranches',
    latitude: 25.0550,
    longitude: 55.2750,
    pricePerShare: 9500,
    totalShares: 450,
    soldShares: 287,
    totalArea: 4800,
    builtArea: 3800,
    bedrooms: 4,
    bathrooms: 5,
    features: ['Private Garden', 'Pool', 'Covered Parking', 'Maid Room', 'Study Room'],
    yearBuilt: 2017,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 5.2,
    expectedROI: 8.8,
    monthlyRental: 32000,
    serviceCharges: 38000,
    view: 'Golf Course View',
    buildingName: 'Palma Villas',
    developer: 'Emaar Properties',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    nearbySchools: ['Jumeirah English Speaking School', 'Ranches Primary School'],
  },

  {
    title: 'Sobha Hartland Studio',
    description: 'Studio moderne dans le prestigieux développement Sobha Hartland. Vue sur le canal, finitions premium, investissement accessible.',
    propertyType: PropertyType.STUDIO,
    emirate: Emirates.DUBAI,
    zone: 'Sobha Hartland',
    address: 'Hartland Greens, Sobha Hartland, MBR City',
    latitude: 25.1880,
    longitude: 55.3150,
    pricePerShare: 3200,
    totalShares: 200,
    soldShares: 156,
    totalArea: 520,
    builtArea: 480,
    bedrooms: 0,
    bathrooms: 1,
    features: ['Canal View', 'Furnished', 'Gym', 'Pool', 'Parking'],
    yearBuilt: 2024,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 9.0,
    expectedROI: 14.5,
    monthlyRental: 5800,
    serviceCharges: 7500,
    view: 'Canal View',
    floorNumber: 12,
    totalFloors: 25,
    buildingName: 'Hartland Greens',
    developer: 'Sobha Realty',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
  },

  {
    title: 'Meydan One Residence',
    description: 'Appartement dans le futur hub de Meydan. À côté du mall et du plus long canal intérieur. Fort potentiel d\'appréciation.',
    propertyType: PropertyType.APARTMENT,
    emirate: Emirates.DUBAI,
    zone: 'Meydan',
    address: 'Meydan One, Nad Al Sheba',
    latitude: 25.1620,
    longitude: 55.3080,
    pricePerShare: 5800,
    totalShares: 320,
    soldShares: 89,
    totalArea: 1150,
    builtArea: 1050,
    bedrooms: 1,
    bathrooms: 2,
    features: ['Racecourse View', 'Pool', 'Gym', 'Smart Home', 'Parking'],
    yearBuilt: 2024,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 8.0,
    expectedROI: 15.0,
    monthlyRental: 11000,
    serviceCharges: 13000,
    view: 'Meydan Racecourse View',
    floorNumber: 22,
    totalFloors: 40,
    buildingName: 'Meydan One Residences',
    developer: 'Meydan Group',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
  },

  {
    title: 'Al Barari Garden Villa',
    description: 'Villa d\'exception dans l\'oasis verte d\'Al Barari. 80% d\'espaces verts, spas, restaurants gastronomiques. Le summum du bien-être à Dubai.',
    propertyType: PropertyType.VILLA,
    emirate: Emirates.DUBAI,
    zone: 'Al Barari',
    address: 'The Nest, Al Barari, Dubai',
    latitude: 25.1020,
    longitude: 55.3180,
    pricePerShare: 22000,
    totalShares: 750,
    soldShares: 198,
    totalArea: 9800,
    builtArea: 7500,
    bedrooms: 6,
    bathrooms: 8,
    features: ['Landscaped Garden', 'Private Pool', 'Home Spa', 'Wine Cellar', 'Staff Quarters', 'Guest House'],
    yearBuilt: 2019,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 4.8,
    expectedROI: 9.0,
    monthlyRental: 120000,
    serviceCharges: 145000,
    view: 'Garden View',
    buildingName: 'The Nest Villas',
    developer: 'Al Barari',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    communityAmenities: ['Heart & Soul Spa', 'Farm-to-Table Restaurant', 'Organic Gardens'],
  },

  {
    title: 'DIFC Gate Avenue',
    description: 'Appartement premium dans le centre financier de Dubai. Clientèle haut de gamme, bureaux des plus grandes entreprises mondiales à portée de main.',
    propertyType: PropertyType.APARTMENT,
    emirate: Emirates.DUBAI,
    zone: 'DIFC',
    address: 'Gate Avenue, DIFC, Dubai',
    latitude: 25.2150,
    longitude: 55.2820,
    pricePerShare: 11500,
    totalShares: 420,
    soldShares: 245,
    totalArea: 1750,
    builtArea: 1600,
    bedrooms: 2,
    bathrooms: 3,
    features: ['DIFC View', 'Premium Finishes', 'Concierge', 'Valet Parking', 'Gym', 'Pool'],
    yearBuilt: 2020,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 6.8,
    expectedROI: 10.5,
    monthlyRental: 28000,
    serviceCharges: 32000,
    view: 'DIFC Skyline View',
    floorNumber: 28,
    totalFloors: 36,
    buildingName: 'DIFC Living',
    developer: 'DIFC Authority',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    distanceToMetro: 0.3,
  },

  {
    title: 'Jumeirah Village Circle Studio',
    description: 'Studio moderne dans JVC, l\'un des quartiers à plus forte croissance locative de Dubai. ROI exceptionnel pour petit budget.',
    propertyType: PropertyType.STUDIO,
    emirate: Emirates.DUBAI,
    zone: 'Jumeirah Village Circle',
    address: 'Bloom Heights, JVC, Dubai',
    latitude: 25.0620,
    longitude: 55.2120,
    pricePerShare: 2400,
    totalShares: 180,
    soldShares: 134,
    totalArea: 450,
    builtArea: 420,
    bedrooms: 0,
    bathrooms: 1,
    features: ['Pool View', 'Balcony', 'Gym', 'Pool', 'Parking'],
    yearBuilt: 2023,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 9.5,
    expectedROI: 15.5,
    monthlyRental: 4200,
    serviceCharges: 5500,
    view: 'Community View',
    floorNumber: 6,
    totalFloors: 16,
    buildingName: 'Bloom Heights',
    developer: 'Bloom Properties',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
  },

  {
    title: 'Dubai South Expo Apartment',
    description: 'Appartement stratégiquement situé près de l\'aéroport Al Maktoum et du site de l\'Expo. Zone en pleine expansion avec Dubai South.',
    propertyType: PropertyType.APARTMENT,
    emirate: Emirates.DUBAI,
    zone: 'Dubai South',
    address: 'The Pulse, Dubai South',
    latitude: 24.9350,
    longitude: 55.1620,
    pricePerShare: 4200,
    totalShares: 250,
    soldShares: 87,
    totalArea: 980,
    builtArea: 900,
    bedrooms: 1,
    bathrooms: 2,
    features: ['Expo View', 'Balcony', 'Gym', 'Pool', 'Retail Access'],
    yearBuilt: 2024,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 8.8,
    expectedROI: 16.0,
    monthlyRental: 7500,
    serviceCharges: 9000,
    view: 'Expo District View',
    floorNumber: 10,
    totalFloors: 18,
    buildingName: 'The Pulse Residences',
    developer: 'Dubai South',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    distanceToAirport: 5.0,
  },

  {
    title: 'Mohammed Bin Rashid City Lagoon',
    description: 'Appartement avec vue sur le lagon artificiel de MBR City. Nouveau quartier premium avec lagoon, parcs et infrastructures de classe mondiale.',
    propertyType: PropertyType.APARTMENT,
    emirate: Emirates.DUBAI,
    zone: 'Mohammed Bin Rashid City',
    address: 'District One, MBR City, Dubai',
    latitude: 25.1750,
    longitude: 55.3250,
    pricePerShare: 8200,
    totalShares: 380,
    soldShares: 156,
    totalArea: 1650,
    builtArea: 1500,
    bedrooms: 2,
    bathrooms: 3,
    features: ['Lagoon View', 'Beach Access', 'Smart Home', 'Gym', 'Pool', 'Kids Area'],
    yearBuilt: 2024,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 7.5,
    expectedROI: 13.5,
    monthlyRental: 19000,
    serviceCharges: 23000,
    view: 'Crystal Lagoon View',
    floorNumber: 16,
    totalFloors: 28,
    buildingName: 'District One Residences',
    developer: 'Meydan Sobha',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
  },

  {
    title: 'Azizi Riviera French Mediterranean',
    description: 'Appartement inspiré de la Côte d\'Azur dans le projet Azizi Riviera. Canal artificiel, plages de sable, ambiance resort en plein cœur de Dubai.',
    propertyType: PropertyType.APARTMENT,
    emirate: Emirates.DUBAI,
    zone: 'Meydan One District',
    address: 'Azizi Riviera, Meydan, Dubai',
    latitude: 25.1680,
    longitude: 55.3120,
    pricePerShare: 4800,
    totalShares: 300,
    soldShares: 201,
    totalArea: 1100,
    builtArea: 1000,
    bedrooms: 1,
    bathrooms: 2,
    features: ['Canal View', 'Beach Access', 'Pool', 'Gym', 'Retail Boulevard'],
    yearBuilt: 2024,
    status: PropertyStatus.PUBLISHED,
    rentalYield: 8.5,
    expectedROI: 14.0,
    monthlyRental: 9000,
    serviceCharges: 11000,
    view: 'Canal & Beach View',
    floorNumber: 8,
    totalFloors: 14,
    buildingName: 'Azizi Riviera Building 32',
    developer: 'Azizi Developments',
    ownershipType: 'Freehold',
    completionStatus: 'Ready',
    communityAmenities: ['Private Beach', 'Water Canal', 'French-style Boulevard'],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════
async function seed() {
  console.log('🌱 Starting property seed...\n');

  try {
    await dataSource.initialize();
    console.log('✅ Database connected\n');

    const userRepo = dataSource.getRepository(User);
    const brandRepo = dataSource.getRepository(DeveloperBrand);
    const propertyRepo = dataSource.getRepository(Property);

    // 1. Find or create developer user (using ADMIN role)
    let developer = await userRepo.findOne({ where: { email: 'developer@reccos.ae' } });

    if (!developer) {
      console.log('📝 Creating developer user...');
      developer = userRepo.create({
        id: uuidv4(),
        email: 'developer@reccos.ae',
        username: 'reccos_developer',
        password: await bcrypt.hash('ReccosDev2024!', 10),
        firstName: 'RECCOS',
        lastName: 'Developer',
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: true,
      });
      await userRepo.save(developer);
      console.log('✅ Developer user created:', developer.email);
    } else {
      console.log('✅ Developer user found:', developer.email);
    }

    // 2. Create developer brands (simple structure: name + logoUrl)
    const brandMap = new Map<string, DeveloperBrand>();

    for (const dev of DEVELOPERS) {
      let brand = await brandRepo.findOne({ where: { name: dev.name } });
      if (!brand) {
        brand = brandRepo.create({
          name: dev.name,
          logoUrl: dev.logo,
        });
        await brandRepo.save(brand);
        console.log(`✅ Brand created: ${dev.name}`);
      }
      brandMap.set(dev.name, brand);
    }

    // 3. Create properties
    console.log('\n📦 Creating properties...\n');

    let created = 0;
    let skipped = 0;

    for (const propData of PROPERTIES_DATA) {
      // Check if property already exists
      const existing = await propertyRepo.findOne({ where: { title: propData.title } });
      if (existing) {
        console.log(`⏭️  Skipped (exists): ${propData.title}`);
        skipped++;
        continue;
      }

      // Get developer brand
      const brand = brandMap.get(propData.developer);

      const property = propertyRepo.create({
        id: uuidv4(),
        developerId: developer.id,
        brandDeveloperId: brand?.id || null,
        title: propData.title,
        description: propData.description,
        propertyType: propData.propertyType,
        emirate: propData.emirate,
        zone: propData.zone,
        address: propData.address,
        latitude: propData.latitude,
        longitude: propData.longitude,
        pricePerShare: propData.pricePerShare,
        totalShares: propData.totalShares,
        soldShares: propData.soldShares,
        totalArea: propData.totalArea,
        builtArea: propData.builtArea,
        bedrooms: propData.bedrooms,
        bathrooms: propData.bathrooms,
        features: propData.features,
        yearBuilt: propData.yearBuilt,
        status: propData.status,
        publishedAt: propData.status === PropertyStatus.PUBLISHED ? new Date() : null,
        publishedById: propData.status === PropertyStatus.PUBLISHED ? developer.id : null,
        rentalYield: propData.rentalYield,
        expectedROI: propData.expectedROI,
        monthlyRental: propData.monthlyRental,
        serviceCharges: propData.serviceCharges,
        view: propData.view,
        floorNumber: propData.floorNumber,
        totalFloors: propData.totalFloors,
        buildingName: propData.buildingName,
        ownershipType: propData.ownershipType || 'Freehold',
        completionStatus: propData.completionStatus || 'Ready',
        handoverDate: propData.handoverDate ? new Date(propData.handoverDate) : null,
        availableAt: propData.availableAt || null,
        distanceToBeach: propData.distanceToBeach,
        distanceToMetro: propData.distanceToMetro,
        distanceToAirport: propData.distanceToAirport,
        nearbySchools: propData.nearbySchools,
        communityAmenities: propData.communityAmenities,
        furnishingStatus: 'Unfurnished',
        parkingSpots: 1,
        securityFeatures: ['24/7 Security', 'CCTV', 'Access Control'],
        // Generate placeholder image URL based on property type
        mainImage: getPropertyImage(propData.propertyType, created),
        images: [
          getPropertyImage(propData.propertyType, created),
          getPropertyImage(propData.propertyType, created + 100),
        ],
      });

      await propertyRepo.save(property);
      const statusEmoji = propData.status === PropertyStatus.UPCOMING ? '🔜' : '✅';
      console.log(`${statusEmoji} Created: ${propData.title} [${propData.status}]`);
      created++;
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`✅ Seed completed!`);
    console.log(`   📦 Properties created: ${created}`);
    console.log(`   ⏭️  Properties skipped: ${skipped}`);
    console.log(`   🏗️  Developer brands: ${brandMap.size}`);
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seed error:', error);
    throw error;
  } finally {
    await dataSource.destroy();
  }
}

// Helper to get realistic property images from Unsplash
function getPropertyImage(type: PropertyType, index: number): string {
  const images: Record<string, string[]> = {
    [PropertyType.APARTMENT]: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
    ],
    [PropertyType.VILLA]: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
    ],
    [PropertyType.PENTHOUSE]: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600&fit=crop',
    ],
    [PropertyType.TOWNHOUSE]: [
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop',
    ],
    [PropertyType.STUDIO]: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800&h=600&fit=crop',
    ],
  };

  const typeImages = images[type] || images[PropertyType.APARTMENT];
  return typeImages[index % typeImages.length];
}

// Run seed
seed().catch(console.error);
