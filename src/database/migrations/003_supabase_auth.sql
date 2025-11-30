-- Migration pour ajouter le support Supabase
-- Ajoute une colonne pour stocker l'identifiant utilisateur Supabase et un index dédié

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS supabase_id UUID UNIQUE;

CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id);
