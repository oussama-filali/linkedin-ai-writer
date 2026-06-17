-- Migration 008 : RLS pour la mémoire RAG par utilisateur
--
-- rag_chunks contient maintenant de la mémoire PERSONNELLE (user_id non NULL).
-- C'est de la donnée personnelle -> RGPD. On durcit l'ancienne policy de lecture
-- "authenticated peut tout lire" qui n'est plus acceptable.
--
-- Comme le backend se connecte en `postgres` (bypass RLS), l'isolation par
-- utilisateur est appliquée DANS LE CODE (requêtes filtrées par user_id).
-- Ici on ferme l'accès direct anon/authenticated pour la mémoire perso.

-- On retire l'ancienne policy permissive (lecture totale).
DROP POLICY IF EXISTS rag_chunks_read_authenticated ON rag_chunks;

-- Lecture autorisée UNIQUEMENT pour le cadre méthodologique partagé (user_id NULL).
-- La mémoire perso (user_id non NULL) reste inaccessible en direct -> backend only.
CREATE POLICY rag_chunks_read_shared_framework
    ON rag_chunks
    FOR SELECT
    TO authenticated
    USING (user_id IS NULL);

COMMENT ON POLICY rag_chunks_read_shared_framework ON rag_chunks IS
    'authenticated ne lit que le cadre partagé (user_id NULL). La mémoire perso passe par le backend.';
