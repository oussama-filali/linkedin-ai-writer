-- Migration 010 : stocker les hashtags générés pour chaque post
--
-- Les hashtags sont générés par l'IA, cohérents avec le sujet du post,
-- et importants pour la portée/audience. On les conserve dans l'historique.

ALTER TABLE generations_history
    ADD COLUMN IF NOT EXISTS hashtags JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN generations_history.hashtags IS 'Hashtags générés (3-5) pertinents au sujet du post, pour la portée';
