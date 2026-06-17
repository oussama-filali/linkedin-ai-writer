-- Migration 006 : type de post (entonnoir) + transparence IA (AI Act) + sources
--
-- - post_type      : le type choisi par l'utilisateur (storytelling, performance, ...)
-- - is_ai_generated: transparence AI Act — le contenu est généré par IA (toujours TRUE ici)
-- - sources        : sources réelles attachées aux infos factuelles (JSONB)

ALTER TABLE generations_history
    ADD COLUMN IF NOT EXISTS post_type TEXT,
    ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS sources JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN generations_history.post_type IS 'Type de post choisi (entonnoir): storytelling | performance | reponse_commentaire | conseil';
COMMENT ON COLUMN generations_history.is_ai_generated IS 'Transparence AI Act: contenu généré par IA';
COMMENT ON COLUMN generations_history.sources IS 'Sources réelles (URLs) pour les infos factuelles du post';
