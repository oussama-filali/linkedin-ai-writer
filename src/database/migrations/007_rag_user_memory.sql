-- Migration 007 : RAG comme MÉMOIRE PERSONNALISÉE par utilisateur
--
-- Le RAG a 3 rôles :
--   1. Mémoire perso (par user_id) : apprend le style/contexte des posts passés
--      de l'utilisateur -> personnalisation réelle.
--   2. Cadre méthodologique (user_id NULL, kind='method') : règles établies,
--      partagées, qui empêchent l'hallucination et l'info non vérifiée.
--   3. Ancrage temporel : created_at déjà présent (référence à la date).
--
-- On étend rag_chunks avec user_id et on élargit les kinds autorisés.

ALTER TABLE rag_chunks
    ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Élargir les types de chunk. On supprime l'ancienne contrainte et on la recrée.
ALTER TABLE rag_chunks DROP CONSTRAINT IF EXISTS rag_chunks_kind_check;
ALTER TABLE rag_chunks
    ADD CONSTRAINT rag_chunks_kind_check
    CHECK (kind IN (
        'memory',  -- post passé de l'utilisateur (mémoire perso, user_id NON NULL)
        'method',  -- règle méthodologique partagée (cadre, user_id NULL)
        'banned',  -- anti-pattern (cadre, user_id NULL)
        'gold',    -- legacy (exemples) - conservé pour compat
        'style'    -- legacy
    ));

-- Index pour récupérer vite la mémoire d'un utilisateur dans un namespace donné.
CREATE INDEX IF NOT EXISTS idx_rag_chunks_user
    ON rag_chunks (user_id, namespace, kind);

COMMENT ON COLUMN rag_chunks.user_id IS 'Mémoire perso : utilisateur propriétaire du chunk. NULL = cadre méthodologique partagé.';
COMMENT ON COLUMN rag_chunks.kind IS 'memory (post passé user) | method (règle) | banned (anti-pattern) | gold/style (legacy)';
