#!/bin/bash

# Script de configuration de la base de données
# Ce script vérifie et configure la base de données pour le projet All4One

set -e

echo "🔧 Configuration de la base de données All4One..."

# Variables (peuvent être surchargées par des variables d'environnement)
DB_NAME="${DB_NAME:-all4one}"
DB_USER="${DB_USER:-all4one_user}"
DB_PASSWORD="${DB_PASSWORD:-}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Vérifier si PostgreSQL est accessible
echo "📡 Vérification de la connexion PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "❌ psql n'est pas installé. Installe PostgreSQL d'abord."
    exit 1
fi

# Fonction pour exécuter une commande SQL
execute_sql() {
    local sql_command="$1"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "$sql_command" 2>&1 || true
}

# Créer la base de données si elle n'existe pas
echo "📦 Vérification de la base de données '$DB_NAME'..."
if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; then
    echo "📝 Création de la base de données '$DB_NAME'..."
    execute_sql "CREATE DATABASE $DB_NAME;"
    echo "✅ Base de données créée avec succès!"
else
    echo "✅ La base de données existe déjà."
fi

# Nettoyer les types enum en double
echo "🧹 Nettoyage des types enum en double..."
PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" <<EOF
DROP TYPE IF EXISTS users_role_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum_old CASCADE;
EOF

echo "✅ Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Exécute les migrations: bun run migration:run"
echo "2. Démarre le serveur: bun run start:dev"


