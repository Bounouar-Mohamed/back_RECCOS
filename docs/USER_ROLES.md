# Système de rôles utilisateur

Ce document décrit le système de rôles et de permissions de l'application All4One.

## 📋 Rôles disponibles

L'application utilise un système de rôles avec 3 niveaux :

### 1. CLIENT (Rôle par défaut)

**Valeur** : `client`

**Description** : Utilisateur standard de l'application

**Permissions** :
- ✅ Créer un compte et se connecter
- ✅ Gérer son propre profil
- ✅ Accéder aux fonctionnalités publiques
- ✅ Effectuer des achats (après vérification KYC)
- ✅ Consulter ses propres données
- ❌ Accéder aux fonctionnalités d'administration
- ❌ Accéder aux APIs de développement
- ❌ Gérer d'autres utilisateurs

**Utilisation** : Tous les nouveaux utilisateurs s'inscrivant via le formulaire d'inscription reçoivent automatiquement ce rôle.

---

### 2. ADMIN

**Valeur** : `admin`

**Description** : Administrateur fonctionnel (espace admin)

**Permissions** :
- ✅ Toutes les permissions CLIENT
- ✅ Gérer les propriétés, promoteurs, performances, etc.
- ✅ Accès aux tableaux de bord et statistiques avancées
- ❌ Créer ou supprimer des comptes administrateurs
- ❌ Changer les rôles des autres administrateurs

**Utilisation** : Rôle attribué pour les personnes qui gèrent l’activité (propriétés, promoteurs, KPI…).

---

### 3. SUPERADMIN

**Valeur** : `superadmin`

**Description** : Super administrateur système avec accès complet

**Permissions** :
- ✅ Toutes les permissions ADMIN
- ✅ Gérer tous les utilisateurs (créer, modifier, supprimer)
- ✅ Modifier les rôles des utilisateurs (client, admin, superadmin)
- ✅ Accéder à toutes les données
- ✅ Configuration de l'application
- ✅ Accès aux logs système complets
- ✅ Gestion des fonctionnalités administratives critiques

**Utilisation** : Rôle réservé aux super administrateurs (fondateurs/tech lead) pour la gestion des comptes et des droits.

---

## 🔐 Hiérarchie des rôles

```
SUPERADMIN (niveau 3)
    ↓
ADMIN (niveau 2)
    ↓
CLIENT (niveau 1)
```

Un rôle supérieur hérite automatiquement des permissions des rôles inférieurs.

---

## 💻 Utilisation dans le code

### Définir un rôle requis sur un endpoint

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  // Seuls les admins peuvent accéder
  @Get('users')
  @Roles(UserRole.ADMIN)
  async getAllUsers() {
    // ...
  }

// Admins et superadmins peuvent accéder
@Get('logs')
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  async getLogs() {
    // ...
  }
}
```

### Vérifier le rôle dans le code

```typescript
import { UserRole, hasRolePermission } from '../common/enums/user-role.enum';

// Dans un service ou contrôleur
if (user.role === UserRole.ADMIN) {
  // Logique réservée aux admins
}

// Vérifier si un utilisateur a au moins le niveau requis
if (hasRolePermission(user.role, UserRole.ADMIN)) {
  // L'utilisateur a au moins les permissions ADMIN
}
```

### Créer un utilisateur avec un rôle spécifique

```typescript
import { UserRole } from '../common/enums/user-role.enum';

// Par défaut, les utilisateurs créés via l'inscription sont CLIENT
const user = await usersService.create({
  email: 'user@example.com',
  // ... autres champs
  role: UserRole.CLIENT, // Optionnel, CLIENT est la valeur par défaut
});

// Pour créer un admin (doit être fait manuellement ou par un autre admin)
const admin = await usersService.create({
  email: 'admin@example.com',
  // ... autres champs
  role: UserRole.ADMIN,
});
```

---

## 🗄️ Base de données

### Type enum PostgreSQL

Le rôle est stocké comme un enum PostgreSQL avec les valeurs :
- `client`
- `developer`
- `admin`

### Migration

Une migration a été créée pour convertir la colonne `role` de `varchar` à `enum` :
- Fichier : `src/database/migrations/1720600000000-AddUserRoleEnum.ts`
- Exécuter : `bun run migration:run`

### Valeur par défaut

Lors de l'inscription, si aucun rôle n'est spécifié, l'utilisateur reçoit automatiquement le rôle `CLIENT`.

---

## 📝 Exemples d'endpoints par rôle

### Endpoints publics (aucun rôle requis)
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/verify-email` - Vérification email

### Endpoints CLIENT (authentifié)
- `GET /api/users/profile` - Profil utilisateur
- `GET /api/users/:id` - Détails utilisateur (son propre profil)
- `POST /api/identity-verification/upload-document` - Upload document KYC

### Endpoints DEVELOPER
- `GET /api/dev/logs` - Logs de développement
- `GET /api/dev/metrics` - Métriques de l'application
- `POST /api/dev/test-endpoint` - Endpoints de test

### Endpoints ADMIN
- `GET /api/admin/users` - Liste tous les utilisateurs
- `PUT /api/admin/users/:id/role` - Modifier le rôle d'un utilisateur
- `DELETE /api/admin/users/:id` - Supprimer un utilisateur
- `GET /api/admin/stats` - Statistiques complètes

---

## 🔄 Changer le rôle d'un utilisateur

### Via l'API (nécessite ADMIN)

```typescript
// Endpoint à créer dans AdminController
@Put('users/:id/role')
@Roles(UserRole.ADMIN)
async updateUserRole(
  @Param('id') id: string,
  @Body('role') role: UserRole,
) {
  return this.usersService.update(id, { role });
}
```

### Via la base de données (directement)

```sql
-- Changer un utilisateur en DEVELOPER
UPDATE users SET role = 'developer' WHERE email = 'user@example.com';

-- Changer un utilisateur en ADMIN
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';

-- Revenir à CLIENT
UPDATE users SET role = 'client' WHERE email = 'user@example.com';
```

---

## ⚠️ Sécurité

### Bonnes pratiques

1. **Ne jamais exposer le changement de rôle dans l'API publique**
   - Seuls les admins peuvent modifier les rôles
   - Vérifier toujours les permissions avant de modifier un rôle

2. **Validation des rôles**
   - Toujours valider que le rôle existe avant de l'assigner
   - Utiliser l'enum `UserRole` pour éviter les erreurs de typage

3. **Audit**
   - Logger tous les changements de rôles
   - Traçabilité des actions administratives

4. **Principe du moindre privilège**
   - Attribuer le rôle le plus bas possible
   - Élever les privilèges uniquement si nécessaire

---

## 🧪 Tests

### Tester les permissions

```typescript
describe('RolesGuard', () => {
  it('should allow ADMIN to access admin endpoints', async () => {
    const adminToken = await getTokenForUser({ role: UserRole.ADMIN });
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
  });

  it('should deny CLIENT access to admin endpoints', async () => {
    const clientToken = await getTokenForUser({ role: UserRole.CLIENT });
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(response.status).toBe(403);
  });
});
```

---

## 📚 Références

- Enum : `src/common/enums/user-role.enum.ts`
- Guard : `src/common/guards/roles.guard.ts`
- Décorateur : `src/common/guards/roles.decorator.ts`
- Entité : `src/database/entities/user.entity.ts`
- Migration : `src/database/migrations/1720600000000-AddUserRoleEnum.ts`

