# 🚀 Guide de Déploiement Production

Ce guide garantit que le backend est **100% prêt pour la production**.

## ✅ Checklist de Production

### 1. Variables d'Environnement

**Variables OBLIGATOIRES en production :**

```env
NODE_ENV=production
PORT=3000

# Base de données
DB_HOST=your-db-host
DB_PORT=5432
DB_USERNAME=your-db-user
DB_PASSWORD=your-secure-password
DB_NAME=all4one

# JWT (CRITIQUE - minimum 32 caractères aléatoires)
JWT_SECRET=your-super-secure-random-secret-minimum-32-characters-long

# CORS (doit être défini avec les URLs de production)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Email
EMAIL_FROM=noreply@yourdomain.com
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
```

**⚠️ IMPORTANT :**
- `JWT_SECRET` doit être **unique** et **aléatoire** (minimum 32 caractères)
- Ne JAMAIS utiliser la valeur par défaut `your-secret-key-change-in-production`
- `CORS_ORIGIN` doit contenir uniquement les domaines de production
- Ne JAMAIS commiter le fichier `.env` dans Git

### 2. Sécurité

✅ **Vérifications automatiques :**
- ✅ `synchronize` est désactivé (utilise les migrations)
- ✅ Swagger est désactivé en production
- ✅ Les détails d'erreur sont masqués en production
- ✅ Validation des variables critiques au démarrage
- ✅ Rate limiting activé
- ✅ Validation des données avec class-validator
- ✅ Protection brute force (comptes verrouillés)

### 3. Base de Données

```bash
# 1. S'assurer que les migrations sont à jour
bun run migration:run

# 2. Vérifier la connexion
psql -h $DB_HOST -U $DB_USERNAME -d $DB_NAME -c "SELECT 1;"
```

### 4. Vérification Pré-Déploiement

```bash
cd /srv/all4one/backend
./scripts/check-production.sh
```

Ce script vérifie :
- ✅ Toutes les variables critiques sont définies
- ✅ JWT_SECRET est sécurisé
- ✅ synchronize est désactivé
- ✅ La compilation fonctionne
- ✅ Les dépendances sont installées

### 5. Build et Démarrage

```bash
# Build
bun run build

# Démarrage production
NODE_ENV=production bun run start:prod
```

Ou avec PM2 (recommandé) :

```bash
# Installation PM2
npm install -g pm2

# Démarrage avec PM2
pm2 start dist/main.js --name all4one-backend --env production

# Sauvegarder la configuration
pm2 save
pm2 startup
```

### 6. Health Checks

Le backend expose des endpoints de health check :

- **Health Check** : `GET /api/health`
- **Readiness Check** : `GET /api/health/ready`

Utilise ces endpoints pour :
- Monitoring (Prometheus, Datadog, etc.)
- Load balancers
- Kubernetes liveness/readiness probes

### 7. Logs

Les logs sont gérés par NestJS Logger :
- Niveau de log configurable via `NODE_ENV`
- Logs structurés avec contexte
- Erreurs loggées avec stack trace (dev uniquement)

**Recommandations :**
- Utiliser un service de logging centralisé (ELK, Datadog, etc.)
- Configurer la rotation des logs
- Monitorer les erreurs 5xx

### 8. Monitoring

**Métriques à surveiller :**
- Taux d'erreur (4xx, 5xx)
- Temps de réponse
- Utilisation CPU/Mémoire
- Connexions base de données
- Rate limiting (tentatives bloquées)

### 9. Sécurité Supplémentaire

**Recommandations :**
- ✅ Utiliser HTTPS uniquement
- ✅ Configurer un firewall
- ✅ Limiter l'accès à la base de données
- ✅ Utiliser des secrets managers (AWS Secrets Manager, HashiCorp Vault)
- ✅ Activer les backups automatiques de la base de données
- ✅ Configurer des alertes pour les erreurs critiques
- ✅ Mettre en place un WAF (Web Application Firewall)

### 10. Performance

**Optimisations :**
- ✅ Utiliser un reverse proxy (Nginx, Traefik)
- ✅ Configurer le cache HTTP
- ✅ Optimiser les requêtes SQL
- ✅ Utiliser un pool de connexions DB
- ✅ Activer la compression (gzip)

## 🚨 Erreurs Communes

### ❌ JWT_SECRET par défaut
```bash
# MAUVAIS
JWT_SECRET=your-secret-key-change-in-production

# BON
JWT_SECRET=$(openssl rand -base64 64)
```

### ❌ synchronize activé
```typescript
// MAUVAIS
synchronize: true

// BON
synchronize: false
```

### ❌ CORS trop permissif
```env
# MAUVAIS
CORS_ORIGIN=*

# BON
CORS_ORIGIN=https://yourdomain.com
```

## 📋 Commandes Utiles

```bash
# Vérification production
./scripts/check-production.sh

# Build
bun run build

# Migrations
bun run migration:run

# Démarrage production
NODE_ENV=production bun run start:prod

# Health check
curl http://localhost:3000/api/health
```

## ✅ Validation Finale

Avant de déployer, assure-toi que :

- [ ] Toutes les variables d'environnement sont définies
- [ ] `check-production.sh` passe sans erreur
- [ ] Les migrations sont à jour
- [ ] Le build fonctionne
- [ ] Les health checks répondent
- [ ] Les logs sont configurés
- [ ] Le monitoring est en place
- [ ] Les backups sont configurés

## 🎉 Déploiement

Une fois toutes les vérifications passées, le backend est **100% prêt pour la production** !


