-- Migration 011 : fiabiliser les dates (fuseau horaire explicite)
--
-- Problème : created_at / updated_at étaient en "timestamp without time zone".
-- Ce type stocke l'heure SANS dire si c'est de l'UTC ou du local -> risque de
-- décalage. La base tourne en UTC, donc on convertit en interprétant comme UTC.
--
-- Contrainte : 2 vues (recent_generations, user_stats) utilisent created_at.
-- On ne peut pas altérer une colonne utilisée par une vue -> on les supprime,
-- on altère, puis on les recrée à l'identique.

-- 1) Supprimer les vues dépendantes
DROP VIEW IF EXISTS recent_generations;
DROP VIEW IF EXISTS user_stats;

-- 2) Convertir les colonnes en timestamptz (valeurs existantes interprétées en UTC)
ALTER TABLE generations_history
    ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
    ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';

-- 3) Recréer les vues à l'identique
CREATE OR REPLACE VIEW recent_generations AS
SELECT
    id,
    user_id,
    SUBSTRING(generated_post, 1, 100) AS preview,
    ton,
    is_safe,
    created_at
FROM generations_history
ORDER BY created_at DESC
LIMIT 50;

CREATE OR REPLACE VIEW user_stats AS
SELECT
    user_id,
    COUNT(*) AS total_generations,
    COUNT(CASE WHEN is_safe = TRUE THEN 1 END) AS safe_posts,
    COUNT(CASE WHEN is_safe = FALSE THEN 1 END) AS flagged_posts,
    COUNT(CASE WHEN ton = 'professionnel' THEN 1 END) AS professionnel_posts,
    COUNT(CASE WHEN ton = 'inspirant' THEN 1 END) AS inspirant_posts,
    COUNT(CASE WHEN ton = 'engagé' THEN 1 END) AS engage_posts,
    MAX(created_at) AS last_generation
FROM generations_history
GROUP BY user_id;

COMMENT ON COLUMN generations_history.created_at IS 'Date de création (timestamptz, fuseau explicite)';
