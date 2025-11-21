-- Script pour nettoyer les types enum en double
-- Exécute ce script dans PostgreSQL si le problème persiste

-- Supprimer le type enum en double s'il existe
DROP TYPE IF EXISTS users_role_enum CASCADE;

-- Si le type user_role_enum_old existe, on peut aussi le supprimer
DROP TYPE IF EXISTS user_role_enum_old CASCADE;

-- Note: Après avoir exécuté ce script, tu devras peut-être recréer les colonnes
-- qui utilisaient ces types. Vérifie d'abord quelles colonnes les utilisent :
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND data_type LIKE '%enum%';


