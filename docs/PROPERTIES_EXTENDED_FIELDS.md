# Champs Étendus des Propriétés - Guide Complet

Ce document liste tous les champs disponibles pour créer des annonces immobilières ultra-détaillées, compétitives avec Dubizzle et Properties Finder.

## ✅ ADMIN peut maintenant créer des annonces

Les **ADMIN** peuvent maintenant créer des annonces, pas seulement les publier. Ils peuvent également :
- Créer des annonces pour un DEVELOPER spécifique (via `developerId`)
- Créer directement en statut `PENDING` (sauter le DRAFT)

---

## 📋 Tous les champs disponibles

### Champs de base (obligatoires)
- `title` - Titre de l'annonce
- `description` - Description détaillée
- `propertyType` - Type (villa, apartment, etc.)
- `emirate` - Émirat (dubai, abu_dhabi, etc.)
- `zone` - Zone/Quartier
- `pricePerShare` - Prix par token en AED
- `totalShares` - Nombre total de tokens
- `totalArea` - Superficie totale en sqft

### Champs de base (optionnels)
- `address` - Adresse complète
- `latitude` / `longitude` - Coordonnées GPS
- `builtArea` - Superficie construite en sqft
- `bedrooms` - Nombre de chambres
- `bathrooms` - Nombre de salles de bain
- `features` - Caractéristiques (array)
- `images` - URLs des images (array)
- `mainImage` - Image principale
- `yearBuilt` - Année de construction

---

## 💰 INFORMATIONS FINANCIÈRES (Nouveaux)

### `rentalYield` (decimal)
**Description** : Rendement locatif annuel en pourcentage  
**Exemple** : `7.5` (pour 7.5% par an)  
**Utilité** : Permet aux investisseurs de comparer les rendements

### `expectedROI` (decimal)
**Description** : ROI (Return on Investment) attendu en pourcentage  
**Exemple** : `12.5` (pour 12.5% par an)  
**Utilité** : ROI projeté sur plusieurs années

### `monthlyRental` (decimal)
**Description** : Loyer mensuel estimé en AED  
**Exemple** : `50000` (50,000 AED/mois)  
**Utilité** : Revenu locatif potentiel

### `serviceCharges` (decimal)
**Description** : Charges de service annuelles en AED  
**Exemple** : `24000` (2,000 AED/mois)  
**Utilité** : Coûts récurrents à prévoir

### `maintenanceFees` (decimal)
**Description** : Frais de maintenance annuels en AED  
**Exemple** : `12000` (1,000 AED/mois)  
**Utilité** : Budget maintenance annuel

### `downPayment` (decimal)
**Description** : Acompte requis en AED  
**Exemple** : `360000` (10% du total)  
**Utilité** : Montant initial à investir

---

## 🔧 INFORMATIONS TECHNIQUES (Nouveaux)

### `coolingSystem` (string)
**Description** : Système de climatisation  
**Valeurs possibles** : `"AC Central"`, `"Split AC"`, `"Chiller"`, `"VRF"`, `"District Cooling"`  
**Utilité** : Important pour les coûts énergétiques

### `heatingSystem` (string)
**Description** : Système de chauffage  
**Valeurs possibles** : `"Central Heating"`, `"Electric"`, `"Gas"`, `"None"`  
**Utilité** : Confort et coûts

### `parkingType` (string)
**Description** : Type de parking  
**Valeurs possibles** : `"Covered"`, `"Open"`, `"Valet"`, `"Underground"`  
**Utilité** : Protection et commodité

### `parkingSpots` (integer)
**Description** : Nombre de places de parking  
**Exemple** : `4`  
**Utilité** : Capacité de stationnement

### `furnishingStatus` (string)
**Description** : Statut d'ameublement  
**Valeurs possibles** : `"Furnished"`, `"Semi-Furnished"`, `"Unfurnished"`  
**Utilité** : Prêt à emménager ou non

---

## 🔒 SÉCURITÉ (Nouveau)

### `securityFeatures` (array)
**Description** : Caractéristiques de sécurité  
**Exemple** : `["CCTV", "Security Guard", "Access Control", "Alarm System", "Gated Community"]`  
**Utilité** : Niveau de sécurité du bien

---

## 🚇 TRANSPORT (Nouveaux)

### `distanceToMetro` (decimal)
**Description** : Distance au métro en km  
**Exemple** : `0.5` (500 mètres)  
**Utilité** : Accessibilité transport public

### `distanceToAirport` (decimal)
**Description** : Distance à l'aéroport en km  
**Exemple** : `15.2`  
**Utilité** : Proximité aéroport

### `distanceToBeach` (decimal)
**Description** : Distance à la plage en km  
**Exemple** : `2.3`  
**Utilité** : Accès plage

### `nearbyTransport` (array)
**Description** : Transports à proximité  
**Exemple** : `["Dubai Marina Metro Station (0.5km)", "JBR Tram Station (0.8km)", "Bus Stop 100m"]`  
**Utilité** : Options de transport détaillées

---

## 🏘️ QUARTIER (Nouveaux)

### `nearbySchools` (array)
**Description** : Écoles à proximité  
**Exemple** : `["Dubai British School (1.2km)", "GEMS World Academy (2.5km)"]`  
**Utilité** : Important pour les familles

### `nearbyHospitals` (array)
**Description** : Hôpitaux à proximité  
**Exemple** : `["Mediclinic Dubai Marina (0.8km)", "American Hospital (5km)"]`  
**Utilité** : Accès aux soins

### `nearbyMalls` (array)
**Description** : Centres commerciaux à proximité  
**Exemple** : `["Dubai Marina Mall (0.3km)", "Mall of the Emirates (8km)"]`  
**Utilité** : Shopping et divertissement

### `nearbyLandmarks` (array)
**Description** : Points d'intérêt à proximité  
**Exemple** : `["Burj Al Arab (3km)", "Palm Jumeirah (5km)", "Dubai Marina Walk (0.2km)"]`  
**Utilité** : Attractions touristiques et lifestyle

---

## 📜 INFORMATIONS LÉGALES (Nouveaux)

### `titleDeed` (string)
**Description** : Numéro du titre de propriété  
**Exemple** : `"DUB-2024-123456"`  
**Utilité** : Vérification légale

### `ownershipType` (string)
**Description** : Type de propriété  
**Valeurs possibles** : `"Freehold"`, `"Leasehold"`, `"Usufruct"`  
**Utilité** : Droits de propriété

### `completionStatus` (string)
**Description** : Statut de complétion  
**Valeurs possibles** : `"Ready"`, `"Off-Plan"`, `"Under Construction"`, `"Near Completion"`  
**Utilité** : Disponibilité immédiate ou future

### `handoverDate` (date)
**Description** : Date de livraison (format YYYY-MM-DD)  
**Exemple** : `"2025-12-31"`  
**Utilité** : Quand le bien sera disponible

---

## 🎥 MÉDIAS (Nouveaux)

### `videos` (array)
**Description** : URLs des vidéos promotionnelles  
**Exemple** : `["https://youtube.com/watch?v=...", "https://vimeo.com/..."]`  
**Utilité** : Vidéos de présentation

### `virtualTourUrl` (string)
**Description** : URL du virtual tour (360°, Matterport, etc.)  
**Exemple** : `"https://matterport.com/tours/..."`  
**Utilité** : Visite virtuelle immersive

### `floorPlans` (array)
**Description** : URLs des plans d'étage  
**Exemple** : `["https://example.com/floor-plan-1.jpg", "https://example.com/floor-plan-2.jpg"]`  
**Utilité** : Plans détaillés de chaque étage

### `documents` (array)
**Description** : URLs des documents (brochures, contrats, etc.)  
**Exemple** : `["https://example.com/brochure.pdf", "https://example.com/payment-plan.pdf"]`  
**Utilité** : Documentation complète

---

## 🏠 INFORMATIONS ADDITIONNELLES (Nouveaux)

### `maidRooms` (integer)
**Description** : Nombre de chambres de bonne  
**Exemple** : `2`  
**Utilité** : Espace pour personnel domestique

### `storageRooms` (integer)
**Description** : Nombre de salles de stockage  
**Exemple** : `1`  
**Utilité** : Espace de rangement

### `view` (string)
**Description** : Vue depuis la propriété  
**Valeurs possibles** : `"Sea View"`, `"City View"`, `"Garden View"`, `"Marina View"`, `"Golf View"`, `"Pool View"`  
**Utilité** : Qualité de la vue

### `facing` (string)
**Description** : Orientation  
**Valeurs possibles** : `"North"`, `"South"`, `"East"`, `"West"`, `"North-East"`, etc.  
**Utilité** : Exposition au soleil

### `floorNumber` (integer)
**Description** : Numéro d'étage  
**Exemple** : `15` (15ème étage)  
**Utilité** : Position dans le bâtiment

### `totalFloors` (integer)
**Description** : Nombre total d'étages dans le bâtiment  
**Exemple** : `50`  
**Utilité** : Hauteur du bâtiment

### `buildingName` (string)
**Description** : Nom du bâtiment  
**Exemple** : `"Marina Heights Tower"`  
**Utilité** : Identification du bâtiment

### `unitNumber` (string)
**Description** : Numéro d'unité  
**Exemple** : `"1505"` ou `"Villa 12"`  
**Utilité** : Identification précise

---

## 🏘️ COMMUNAUTÉ (Nouveaux)

### `communityAmenities` (array)
**Description** : Équipements de la communauté  
**Exemple** : `["Gym", "Swimming Pool", "Kids Play Area", "BBQ Area", "Tennis Court", "Spa", "Concierge"]`  
**Utilité** : Services disponibles dans la communauté

### `communityName` (string)
**Description** : Nom de la communauté  
**Exemple** : `"Dubai Marina"`, `"Palm Jumeirah"`, `"Downtown Dubai"`  
**Utilité** : Identification de la communauté

---

## 📞 CONTACT

**Important** : Les informations de contact direct ne sont **PAS** stockées dans les propriétés.

Le CLIENT peut voir les informations du DEVELOPER (nom, username) mais **ne peut pas le contacter directement**. Tous les contacts doivent passer par la plateforme via un système de messages/demandes.

**Informations visibles du DEVELOPER** :
- `id` - Identifiant unique
- `username` - Nom d'utilisateur
- `firstName` - Prénom
- `lastName` - Nom de famille

**Informations NON visibles** :
- ❌ `email` - Email (privé)
- ❌ `phone` - Téléphone (privé)
- ❌ Toute autre information de contact direct

---

## 📊 DISPONIBILITÉ (Nouveaux)

### `availabilityStatus` (string)
**Description** : Statut de disponibilité  
**Valeurs possibles** : `"Available"`, `"Reserved"`, `"Sold Out"`, `"Limited Availability"`  
**Utilité** : Disponibilité immédiate

### `listingType` (string)
**Description** : Type d'annonce  
**Valeurs possibles** : `"Sale"`, `"Rent"`, `"Both"`  
**Utilité** : Vente ou location

---

## 🔍 Filtres de recherche disponibles

Tous ces nouveaux champs peuvent être utilisés pour filtrer les recherches :

```
GET /api/properties?
  &minRentalYield=5
  &maxRentalYield=10
  &completionStatus=Ready
  &listingType=Sale
  &furnishingStatus=Furnished
  &view=Sea View
  &maxDistanceToMetro=1
  &maxDistanceToBeach=5
```

---

## 📝 Exemple complet d'annonce

```json
{
  "title": "Infinity pool in Dubai",
  "description": "Luxury villa with infinity pool and private beach access...",
  "propertyType": "villa",
  "emirate": "dubai",
  "zone": "Dubai Marina",
  "address": "Dubai Marina, Dubai, UAE",
  "latitude": 25.0772,
  "longitude": 55.1394,
  "pricePerShare": 7200,
  "totalShares": 500,
  "totalArea": 12800,
  "builtArea": 10000,
  "bedrooms": 6,
  "bathrooms": 8,
  "features": ["Private Beach Access", "Infinity Pool", "Gym", "Parking"],
  "images": ["https://example.com/image1.jpg"],
  "mainImage": "https://example.com/main-image.jpg",
  "yearBuilt": 2023,
  
  // NOUVEAUX CHAMPS
  "rentalYield": 7.5,
  "expectedROI": 12.5,
  "monthlyRental": 50000,
  "serviceCharges": 24000,
  "maintenanceFees": 12000,
  "downPayment": 360000,
  
  "coolingSystem": "AC Central",
  "heatingSystem": "Electric",
  "parkingType": "Covered",
  "parkingSpots": 4,
  "furnishingStatus": "Furnished",
  
  "securityFeatures": ["CCTV", "Security Guard", "Access Control", "Gated Community"],
  
  "distanceToMetro": 0.5,
  "distanceToAirport": 15.2,
  "distanceToBeach": 2.3,
  "nearbyTransport": ["Dubai Marina Metro (0.5km)", "JBR Tram (0.8km)"],
  
  "nearbySchools": ["Dubai British School (1.2km)", "GEMS World Academy (2.5km)"],
  "nearbyHospitals": ["Mediclinic Dubai Marina (0.8km)"],
  "nearbyMalls": ["Dubai Marina Mall (0.3km)", "Mall of the Emirates (8km)"],
  "nearbyLandmarks": ["Burj Al Arab (3km)", "Palm Jumeirah (5km)"],
  
  "titleDeed": "DUB-2024-123456",
  "ownershipType": "Freehold",
  "completionStatus": "Ready",
  "handoverDate": "2024-01-15",
  
  "videos": ["https://youtube.com/watch?v=..."],
  "virtualTourUrl": "https://matterport.com/tours/...",
  "floorPlans": ["https://example.com/floor-plan.jpg"],
  "documents": ["https://example.com/brochure.pdf"],
  
  "maidRooms": 2,
  "storageRooms": 1,
  "view": "Sea View",
  "facing": "South",
  "floorNumber": 15,
  "totalFloors": 50,
  "buildingName": "Marina Heights Tower",
  "unitNumber": "1505",
  
  "communityAmenities": ["Gym", "Swimming Pool", "Kids Play Area", "BBQ Area"],
  "communityName": "Dubai Marina",
  
  // Note: Pas de contact direct
  // Le contact se fait via la plateforme
  
  "availabilityStatus": "Available",
  "listingType": "Sale"
}
```

---

## 🎯 Avantages compétitifs

Avec tous ces champs, votre plateforme offre :

✅ **Plus d'informations** que Dubizzle et Properties Finder  
✅ **Recherches ultra-précises** avec tous les filtres  
✅ **Transparence totale** pour les investisseurs  
✅ **Informations financières** (ROI, yield) pour l'analyse  
✅ **Médias riches** (vidéos, virtual tours, plans)  
✅ **Informations de quartier** complètes  
✅ **Détails techniques** précis  
✅ **Informations légales** vérifiables  

---

## 📊 Statistiques

**Total de champs disponibles** : **60+ champs**

- Champs de base : 15
- Informations financières : 6
- Informations techniques : 5
- Sécurité : 1
- Transport : 4
- Quartier : 4
- Informations légales : 4
- Médias : 4
- Informations additionnelles : 8
- Communauté : 2
- Contact : 3
- Disponibilité : 2
- Métadonnées : 1

---

## 🚀 Prêt pour la production

Tous les champs sont :
- ✅ Validés
- ✅ Indexés pour les performances
- ✅ Documentés
- ✅ Migrés en base de données
- ✅ Disponibles via l'API

