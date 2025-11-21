#!/bin/bash

# Script de vérification pour la production
# Vérifie que toutes les configurations sont correctes avant le déploiement

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Vérification de la configuration production..."
echo ""

ERRORS=0
WARNINGS=0

# Vérifier que NODE_ENV est défini
if [ -z "$NODE_ENV" ]; then
    echo -e "${YELLOW}⚠️  NODE_ENV n'est pas défini (sera 'development' par défaut)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Vérifier le fichier .env
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Fichier .env manquant${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ Fichier .env présent${NC}"
    
    # Charger les variables d'environnement
    export $(cat .env | grep -v '^#' | xargs)
    
    # Variables critiques
    CRITICAL_VARS=(
        "JWT_SECRET"
        "DB_HOST"
        "DB_USERNAME"
        "DB_PASSWORD"
        "DB_NAME"
    )
    
    for var in "${CRITICAL_VARS[@]}"; do
        if [ -z "${!var}" ] || [ "${!var}" = "" ]; then
            echo -e "${RED}❌ Variable critique manquante: $var${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${GREEN}✅ $var est défini${NC}"
            
            # Vérifications spécifiques
            if [ "$var" = "JWT_SECRET" ]; then
                JWT_SECRET_VALUE="${!var}"
                if [ "$JWT_SECRET_VALUE" = "your-secret-key-change-in-production" ]; then
                    echo -e "${RED}❌ JWT_SECRET utilise la valeur par défaut (DANGEREUX!)${NC}"
                    ERRORS=$((ERRORS + 1))
                elif [ ${#JWT_SECRET_VALUE} -lt 32 ]; then
                    echo -e "${YELLOW}⚠️  JWT_SECRET est trop court (minimum 32 caractères recommandé)${NC}"
                    WARNINGS=$((WARNINGS + 1))
                else
                    echo -e "${GREEN}✅ JWT_SECRET est sécurisé${NC}"
                fi
            fi
        fi
    done
    
    # Vérifier CORS_ORIGIN en production
    if [ "$NODE_ENV" = "production" ]; then
        if [ -z "$CORS_ORIGIN" ] || [ "$CORS_ORIGIN" = "" ]; then
            echo -e "${RED}❌ CORS_ORIGIN doit être défini en production${NC}"
            ERRORS=$((ERRORS + 1))
        else
            echo -e "${GREEN}✅ CORS_ORIGIN est défini${NC}"
        fi
    fi
fi

# Vérifier que synchronize est désactivé
if grep -q "synchronize: true" src/config/configuration.ts 2>/dev/null; then
    echo -e "${RED}❌ synchronize est activé (DANGEREUX en production!)${NC}"
    ERRORS=$((ERRORS + 1))
else
    echo -e "${GREEN}✅ synchronize est désactivé${NC}"
fi

# Vérifier les dépendances
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}⚠️  node_modules manquant, exécute 'bun install'${NC}"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Dépendances installées${NC}"
fi

# Vérifier que le build fonctionne
echo ""
echo "🔨 Test de compilation..."
if bun run build > /tmp/build-check.log 2>&1; then
    echo -e "${GREEN}✅ Compilation réussie${NC}"
else
    echo -e "${RED}❌ Erreur de compilation${NC}"
    echo "Voir /tmp/build-check.log pour les détails"
    ERRORS=$((ERRORS + 1))
fi

# Résumé
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ Toutes les vérifications sont passées!${NC}"
    echo -e "${GREEN}Le backend est prêt pour la production.${NC}"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s) - Vérifie les points ci-dessus${NC}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) critique(s) trouvée(s)${NC}"
    echo -e "${RED}Le backend n'est PAS prêt pour la production.${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s) supplémentaire(s)${NC}"
    fi
    exit 1
fi

