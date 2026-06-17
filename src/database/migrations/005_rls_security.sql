-- Migration 005 : Sécurité RLS (défense en profondeur) + conformité RGPD
--
-- Contexte :
--   - Le backend Express se connecte avec le rôle `postgres`, qui BYPASS RLS.
--     Activer RLS ne casse donc RIEN côté backend.
--   - Le mobile utilise Supabase UNIQUEMENT pour l'authentification (clé anon).
--     Toutes les données transitent par le backend.
--   - Objectif : si la clé `anon`/`authenticated` fuit ou si un jour le client
--     attaque Supabase en direct, RLS bloque tout accès aux données.
--
-- Principe zero-trust : on ACTIVE RLS partout, et on ne crée AUCUNE policy
-- permissive pour anon/authenticated sur les tables de données personnelles.
-- Sans policy, RLS interdit tout accès aux rôles non-superuser -> porte fermée.

-- ─────────────────────────────────────────────────────────────
-- Tables contenant des données personnelles : RLS activé, aucune policy publique.
-- (accès uniquement via le backend en `postgres`)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations_history   ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences      ENABLE ROW LEVEL SECURITY;

-- Forcer RLS même pour le propriétaire de la table (sauf superuser/bypassrls).
-- Ceinture + bretelles : empêche un rôle propriétaire non-superuser de contourner.
ALTER TABLE users                 FORCE ROW LEVEL SECURITY;
ALTER TABLE generations_history   FORCE ROW LEVEL SECURITY;
ALTER TABLE prompts_templates     FORCE ROW LEVEL SECURITY;
ALTER TABLE predictions_analytics FORCE ROW LEVEL SECURITY;
ALTER TABLE user_preferences      FORCE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- rag_chunks : savoir GÉNÉRIQUE et NON personnel (exemples anonymes d'écriture).
-- RGPD : cette table ne doit JAMAIS contenir de données utilisateur.
-- On autorise la LECTURE seule au rôle authenticated (le contenu n'est pas sensible),
-- mais on interdit toute écriture publique (seed/maj via backend uniquement).
-- ─────────────────────────────────────────────────────────────
ALTER TABLE rag_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rag_chunks_read_authenticated ON rag_chunks;
CREATE POLICY rag_chunks_read_authenticated
    ON rag_chunks
    FOR SELECT
    TO authenticated
    USING (true);

-- Aucune policy INSERT/UPDATE/DELETE pour anon/authenticated -> écriture impossible
-- sauf via le backend `postgres`.

COMMENT ON TABLE rag_chunks IS 'Savoir générique d''écriture (exemples anonymes). NE JAMAIS y stocker de données personnelles (RGPD).';
