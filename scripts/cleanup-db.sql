-- Script de nettoyage complet de la base de données
-- ATTENTION: Ce script supprime les types enum en double
-- Exécute-le uniquement si tu as des problèmes de synchronisation

-- Supprimer les types enum en double
DROP TYPE IF EXISTS users_role_enum CASCADE;
DROP TYPE IF EXISTS user_role_enum_old CASCADE;

-- Vérifier les types enum existants
SELECT typname, typtype 
FROM pg_type 
WHERE typname LIKE '%enum%' 
AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');


