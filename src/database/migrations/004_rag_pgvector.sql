-- Migration 004 : RAG vector store (pgvector)
-- pgvector est déjà activé sur Supabase (extension `vector` v0.8.0, schéma public).
-- CREATE EXTENSION est idempotent : sans effet si déjà présent.

CREATE EXTENSION IF NOT EXISTS vector;

-- Table des chunks de connaissance pour le RAG.
-- namespace = type de post (storytelling, performance, reponse_commentaire, conseil)
-- kind      = nature du chunk :
--   'gold'   → exemple positif (la voix à imiter), avec metadata { secteur, situation }
--   'banned' → anti-exemple / pattern interdit (garde-fou négatif)
--   'style'  → marqueur de texture concret
-- embedding = vecteur 1536 dims (modèle OpenAI text-embedding-3-small)
CREATE TABLE IF NOT EXISTS rag_chunks (
    id SERIAL PRIMARY KEY,
    namespace TEXT NOT NULL,
    kind TEXT NOT NULL CHECK (kind IN ('gold', 'banned', 'style')),
    content TEXT NOT NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index de recherche par similarité cosinus (HNSW, supporté par pgvector >= 0.5).
-- Plus rapide et plus précis qu'ivfflat pour des volumes modérés.
CREATE INDEX IF NOT EXISTS idx_rag_chunks_embedding
    ON rag_chunks USING hnsw (embedding vector_cosine_ops);

-- Index pour filtrer rapidement par type de post et nature de chunk.
CREATE INDEX IF NOT EXISTS idx_rag_chunks_namespace_kind
    ON rag_chunks (namespace, kind);

COMMENT ON TABLE rag_chunks IS 'Vector store RAG : exemples GOLD / anti-exemples BANNED / marqueurs STYLE par type de post';
COMMENT ON COLUMN rag_chunks.namespace IS 'Type de post (storytelling, performance, reponse_commentaire, conseil)';
COMMENT ON COLUMN rag_chunks.kind IS 'Nature du chunk: gold | banned | style';
COMMENT ON COLUMN rag_chunks.metadata IS 'Pour les chunks gold: { secteur, situation } pour un retrieval plus pertinent';
