#!/bin/bash

# Script pour nettoyer et réparer la base de données
# Utilise ce script si tu as des problèmes de synchronisation TypeORM

set -e

echo "🔧 Réparation de la base de données All4One..."
echo ""

# Charger les variables d'environnement
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_NAME="${DB_NAME:-all4one}"
DB_USER="${DB_USERNAME:-all4one_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

echo "📡 Connexion à PostgreSQL..."
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Nettoyer les types enum en double
echo "🧹 Nettoyage des types enum en double..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
-- Supprimer les types enum en double
DROP TYPE IF EXISTS users_role_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum_old CASCADE;

-- Vérifier les types enum restants
SELECT typname, typtype 
FROM pg_type 
WHERE typname LIKE '%enum%' 
AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');
EOF

echo ""
echo "✅ Nettoyage terminé!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Exécute les migrations: bun run migration:run"
echo "2. Redémarre le serveur: bun run start:dev"


