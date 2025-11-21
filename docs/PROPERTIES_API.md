# API de Gestion des Propriétés Immobilières

Documentation complète des APIs pour la gestion des annonces immobilières.

## 📋 Vue d'ensemble

Le système permet aux **DEVELOPER** (Damac, Emaar, etc.) de créer des annonces, aux **ADMIN** de les publier, et aux **CLIENT** de les consulter et acheter des tokens.

## 🔐 Permissions par rôle

| Action | CLIENT | DEVELOPER | ADMIN |
|--------|--------|-----------|-------|
| Voir les annonces publiées | ✅ | ✅ | ✅ |
| Voir ses propres annonces | ❌ | ✅ | ✅ |
| Voir toutes les annonces | ❌ | ❌ | ✅ |
| Créer une annonce | ❌ | ✅ | ✅ |
| Modifier une annonce | ❌ | ✅ (ses propres) | ✅ (toutes) |
| Publier une annonce | ❌ | ❌ | ✅ |
| Rejeter une annonce | ❌ | ❌ | ✅ |
| Supprimer une annonce | ❌ | ✅ (ses propres) | ✅ (toutes) |

---

## 📍 Endpoints disponibles

### Base URL
```
http://localhost:3000/api/properties
```

---

## 1. Créer une annonce (DEVELOPER ou ADMIN)

**Endpoint** : `POST /api/properties`

**Permissions** : DEVELOPER ou ADMIN

**Description** : Crée une nouvelle annonce immobilière. DEVELOPER crée en DRAFT, ADMIN peut créer directement en PENDING et assigner à un DEVELOPER.

**Headers** :
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Body** (exemple complet avec tous les champs disponibles) :
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
  
  // Informations financières
  "rentalYield": 7.5,
  "expectedROI": 12.5,
  "monthlyRental": 50000,
  "serviceCharges": 24000,
  "maintenanceFees": 12000,
  "downPayment": 360000,
  
  // Informations techniques
  "coolingSystem": "AC Central",
  "parkingType": "Covered",
  "parkingSpots": 4,
  "furnishingStatus": "Furnished",
  
  // Sécurité
  "securityFeatures": ["CCTV", "Security Guard", "Access Control"],
  
  // Transport
  "distanceToMetro": 0.5,
  "distanceToAirport": 15.2,
  "distanceToBeach": 2.3,
  "nearbyTransport": ["Dubai Marina Metro (0.5km)"],
  
  // Quartier
  "nearbySchools": ["Dubai British School (1.2km)"],
  "nearbyHospitals": ["Mediclinic Dubai Marina (0.8km)"],
  "nearbyMalls": ["Dubai Marina Mall (0.3km)"],
  "nearbyLandmarks": ["Burj Al Arab (3km)"],
  
  // Informations légales
  "titleDeed": "DUB-2024-123456",
  "ownershipType": "Freehold",
  "completionStatus": "Ready",
  "handoverDate": "2024-01-15",
  
  // Médias
  "videos": ["https://youtube.com/watch?v=..."],
  "virtualTourUrl": "https://matterport.com/tours/...",
  "floorPlans": ["https://example.com/floor-plan.jpg"],
  "documents": ["https://example.com/brochure.pdf"],
  
  // Informations additionnelles
  "maidRooms": 2,
  "view": "Sea View",
  "facing": "South",
  "floorNumber": 15,
  "buildingName": "Marina Heights Tower",
  "unitNumber": "1505",
  
  // Communauté
  "communityAmenities": ["Gym", "Swimming Pool"],
  "communityName": "Dubai Marina",
  
  // Contact
  "contactPhone": "+971 50 123 4567",
  "contactEmail": "sales@damac.com",
  
  // Disponibilité
  "availabilityStatus": "Available",
  "listingType": "Sale",
  
  // Pour ADMIN uniquement
  "developerId": "uuid-of-developer",
  "status": "pending"
}
```

**Note** : Tous les champs sauf ceux marqués comme obligatoires sont optionnels. Consultez `PROPERTIES_EXTENDED_FIELDS.md` pour la liste complète de tous les champs disponibles.

**Réponse succès (201 Created)** :
```json
{
  "data": {
    "id": "uuid",
    "title": "Infinity pool in Dubai",
    "description": "...",
    "propertyType": "villa",
    "emirate": "dubai",
    "zone": "Dubai Marina",
    "pricePerShare": "7200.00",
    "totalShares": 500,
    "soldShares": 0,
    "totalArea": "12800.00",
    "bedrooms": 6,
    "bathrooms": 8,
    "features": ["Private Beach Access", "Infinity Pool", ...],
    "images": ["https://example.com/image1.jpg", ...],
    "status": "draft",
    "developerId": "uuid",
    "createdAt": "2025-11-09T18:00:00.000Z",
    "updatedAt": "2025-11-09T18:00:00.000Z"
  },
  "statusCode": 201,
  "message": "Success"
}
```

**Types de propriétés disponibles** :
- `apartment` - Appartement
- `villa` - Villa
- `townhouse` - Maison de ville
- `penthouse` - Penthouse
- `studio` - Studio
- `land` - Terrain
- `commercial` - Commercial

**Émirats disponibles** :
- `dubai` - Dubai
- `abu_dhabi` - Abu Dhabi
- `sharjah` - Sharjah
- `ajman` - Ajman
- `umm_al_quwain` - Umm Al Quwain
- `ras_al_khaimah` - Ras Al Khaimah
- `fujairah` - Fujairah

---

## 2. Lister les annonces avec filtres

**Endpoint** : `GET /api/properties`

**Permissions** : Tous (authentifié)

**Description** : Liste les annonces selon le rôle de l'utilisateur

**Query Parameters** :
```
?propertyType=villa
&emirate=dubai
&zone=Dubai Marina
&minPrice=5000
&maxPrice=10000
&minArea=10000
&maxArea=20000
&bedrooms=6
&status=published
&minRentalYield=5
&maxRentalYield=10
&completionStatus=Ready
&listingType=Sale
&furnishingStatus=Furnished
&view=Sea View
&maxDistanceToMetro=1
&maxDistanceToBeach=5
&page=1
&limit=20
```

**Exemple de requête** :
```bash
GET /api/properties?emirate=dubai&propertyType=villa&minPrice=5000&page=1&limit=20
```

**Réponse succès (200 OK)** :
```json
{
  "data": {
    "properties": [
      {
        "id": "uuid",
        "title": "Infinity pool in Dubai",
        "propertyType": "villa",
        "emirate": "dubai",
        "zone": "Dubai Marina",
        "pricePerShare": "7200.00",
        "totalShares": 500,
        "soldShares": 0,
        "totalArea": "12800.00",
        "bedrooms": 6,
        "bathrooms": 8,
        "mainImage": "https://example.com/main-image.jpg",
        "status": "published",
        "developer": {
          "id": "uuid",
          "username": "damac",
          "firstName": "Damac",
          "lastName": "Properties"
        },
        "createdAt": "2025-11-09T18:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20
  },
  "statusCode": 200,
  "message": "Success"
}
```

**Comportement selon le rôle** :
- **CLIENT** : Voit uniquement les annonces avec `status: "published"`
- **DEVELOPER** : Voit uniquement ses propres annonces (tous statuts)
- **ADMIN** : Voit toutes les annonces (tous statuts)

---

## 3. Obtenir les détails d'une annonce

**Endpoint** : `GET /api/properties/:id`

**Permissions** : Tous (authentifié)

**Description** : Récupère les détails complets d'une annonce

**Réponse succès (200 OK)** :
```json
{
  "data": {
    "id": "uuid",
    "title": "Infinity pool in Dubai",
    "description": "Luxury villa with infinity pool...",
    "propertyType": "villa",
    "emirate": "dubai",
    "zone": "Dubai Marina",
    "address": "Dubai Marina, Dubai, UAE",
    "latitude": "25.07720000",
    "longitude": "55.13940000",
    "pricePerShare": "7200.00",
    "totalShares": 500,
    "soldShares": 0,
    "totalArea": "12800.00",
    "builtArea": "10000.00",
    "bedrooms": 6,
    "bathrooms": 8,
    "features": [
      "Private Beach Access",
      "Infinity Pool",
      "Gym",
      "Parking"
    ],
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "mainImage": "https://example.com/main-image.jpg",
    "yearBuilt": 2023,
    "status": "published",
    "publishedAt": "2025-11-09T19:00:00.000Z",
    "metadata": {
      "parkingSpots": 4,
      "balcony": true,
      "furnished": true
    },
    "developer": {
      "id": "uuid",
      "username": "damac",
      "firstName": "Damac",
      "lastName": "Properties",
      "email": "contact@damac.com"
    },
    "publishedBy": {
      "id": "uuid",
      "username": "admin",
      "firstName": "Admin",
      "lastName": "User"
    },
    "createdAt": "2025-11-09T18:00:00.000Z",
    "updatedAt": "2025-11-09T19:00:00.000Z"
  },
  "statusCode": 200,
  "message": "Success"
}
```

**Erreurs** :
- **404** : Propriété non trouvée
- **403** : CLIENT essaie d'accéder à une annonce non publiée

---

## 4. Modifier une annonce

**Endpoint** : `PATCH /api/properties/:id`

**Permissions** : DEVELOPER (ses propres) ou ADMIN (toutes)

**Description** : Met à jour une annonce existante

**Body** (tous les champs sont optionnels) :
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "pricePerShare": 7500,
  "bedrooms": 7,
  "features": ["New Feature"],
  "status": "pending"
}
```

**Règles** :
- **DEVELOPER** : 
  - Peut modifier uniquement ses propres annonces
  - Peut modifier uniquement si status = `draft`, `pending`, ou `rejected`
  - Ne peut PAS changer le `status` ou `rejectionReason`
- **ADMIN** : 
  - Peut modifier toutes les annonces
  - Peut changer le `status`
  - Si status devient `published`, `publishedAt` et `publishedById` sont automatiquement définis

**Réponse succès (200 OK)** :
```json
{
  "data": {
    "id": "uuid",
    "title": "Updated title",
    ...
  },
  "statusCode": 200,
  "message": "Success"
}
```

---

## 5. Publier une annonce (ADMIN uniquement)

**Endpoint** : `POST /api/properties/:id/publish`

**Permissions** : ADMIN

**Description** : Publie une annonce (change le status à `published`)

**Body** (optionnel) :
```json
{
  "notes": "Property verified and approved"
}
```

**Réponse succès (200 OK)** :
```json
{
  "data": {
    "id": "uuid",
    "status": "published",
    "publishedAt": "2025-11-09T20:00:00.000Z",
    "publishedById": "admin-uuid",
    ...
  },
  "statusCode": 200,
  "message": "Success"
}
```

**Erreurs** :
- **400** : Annonce déjà publiée ou vendue
- **403** : Seuls les admins peuvent publier

---

## 6. Rejeter une annonce (ADMIN uniquement)

**Endpoint** : `POST /api/properties/:id/reject`

**Permissions** : ADMIN

**Description** : Rejette une annonce avec une raison

**Body** :
```json
{
  "reason": "Images de mauvaise qualité. Veuillez fournir des photos haute résolution."
}
```

**Réponse succès (200 OK)** :
```json
{
  "data": {
    "id": "uuid",
    "status": "rejected",
    "rejectionReason": "Images de mauvaise qualité...",
    ...
  },
  "statusCode": 200,
  "message": "Success"
}
```

---

## 7. Supprimer une annonce

**Endpoint** : `DELETE /api/properties/:id`

**Permissions** : DEVELOPER (ses propres) ou ADMIN (toutes)

**Description** : Supprime une annonce (soft delete)

**Règles** :
- **DEVELOPER** : 
  - Peut supprimer uniquement ses propres annonces
  - Ne peut PAS supprimer les annonces `published` ou `sold`
- **ADMIN** : Peut supprimer toutes les annonces

**Réponse succès (204 No Content)** :
```
(No body)
```

---

## 8. Statistiques (ADMIN uniquement)

**Endpoint** : `GET /api/properties/admin/stats`

**Permissions** : ADMIN

**Description** : Récupère les statistiques des annonces

**Réponse succès (200 OK)** :
```json
{
  "data": {
    "total": 150,
    "byStatus": {
      "draft": 20,
      "pending": 15,
      "published": 100,
      "sold": 10,
      "rejected": 5
    },
    "byEmirate": {
      "dubai": 80,
      "abu_dhabi": 40,
      "sharjah": 20,
      "ajman": 10
    }
  },
  "statusCode": 200,
  "message": "Success"
}
```

---

## 📊 Statuts des annonces

| Statut | Description | Visible par CLIENT |
|--------|-------------|-------------------|
| `draft` | Brouillon créé par DEVELOPER | ❌ |
| `pending` | En attente de validation ADMIN | ❌ |
| `published` | Publiée et visible | ✅ |
| `sold` | Tous les tokens vendus | ✅ (mais non disponible) |
| `rejected` | Rejetée par ADMIN | ❌ |
| `archived` | Archivée | ❌ |

---

## 🔄 Workflow typique

### 1. DEVELOPER crée une annonce
```
POST /api/properties
→ Status: DRAFT
```

### 2. DEVELOPER soumet pour validation
```
PATCH /api/properties/:id
Body: { "status": "pending" }
→ Status: PENDING
```

### 3. ADMIN valide et publie
```
POST /api/properties/:id/publish
→ Status: PUBLISHED
→ Visible par les CLIENT
```

### 4. CLIENT consulte l'annonce
```
GET /api/properties/:id
→ Voit tous les détails
```

---

## 💡 Exemples d'utilisation

### Exemple 1 : Créer une annonce complète (DEVELOPER)

```javascript
const response = await fetch('http://localhost:3000/api/properties', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${developerToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: "Infinity pool in Dubai",
    description: "Luxury villa with infinity pool and private beach access...",
    propertyType: "villa",
    emirate: "dubai",
    zone: "Dubai Marina",
    address: "Dubai Marina, Dubai, UAE",
    latitude: 25.0772,
    longitude: 55.1394,
    pricePerShare: 7200,
    totalShares: 500,
    totalArea: 12800,
    builtArea: 10000,
    bedrooms: 6,
    bathrooms: 8,
    features: [
      "Private Beach Access",
      "Infinity Pool",
      "Gym",
      "Parking"
    ],
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    mainImage: "https://example.com/main-image.jpg",
    yearBuilt: 2023,
    metadata: {
      parkingSpots: 4,
      balcony: true,
      furnished: true
    }
  }),
});
```

### Exemple 2 : Rechercher des villas à Dubai (CLIENT)

```javascript
const response = await fetch(
  'http://localhost:3000/api/properties?propertyType=villa&emirate=dubai&minPrice=5000&maxPrice=10000&page=1&limit=20',
  {
    headers: {
      'Authorization': `Bearer ${clientToken}`,
    },
  }
);
```

### Exemple 3 : Publier une annonce (ADMIN)

```javascript
const response = await fetch(`http://localhost:3000/api/properties/${propertyId}/publish`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    notes: "Property verified and approved"
  }),
});
```

---

## ⚠️ Notes importantes

1. **Images** : Les URLs d'images doivent être accessibles publiquement
2. **Prix** : Toujours en AED (Dirhams des Émirats Arabes Unis)
3. **Superficie** : Toujours en sqft (square feet)
4. **Coordonnées GPS** : Optionnelles mais recommandées pour la géolocalisation
5. **Validation** : Tous les champs sont validés avant sauvegarde
6. **Soft Delete** : Les annonces supprimées sont archivées, pas supprimées définitivement

---

## 🧪 Tests

Tous les endpoints sont documentés dans Swagger :
```
http://localhost:3000/api/docs
```

