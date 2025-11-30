-- Migration initiale pour linkedin-ai-writer
-- Exécuter avec: psql -U username -d linkedin_ai_writer -f 001_initial_schema.sql

-- Table des utilisateurs (pour future authentification)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    linkedin_profile VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des templates de prompts personnalisés
CREATE TABLE IF NOT EXISTS prompts_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    ton VARCHAR(50) NOT NULL CHECK (ton IN ('professionnel', 'inspirant', 'engagé')),
    template_text TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table d'historique des générations
CREATE TABLE IF NOT EXISTS generations_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resume TEXT NOT NULL,
    objectif VARCHAR(500) NOT NULL,
    ton VARCHAR(50) NOT NULL CHECK (ton IN ('professionnel', 'inspirant', 'engagé')),
    sujet VARCHAR(500),
    generated_post TEXT NOT NULL,
    improved_post TEXT,
    improvement_feedback TEXT,
    fact_check_result JSONB,
    is_safe BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON generations_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON generations_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_ton ON generations_history(ton);
CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON prompts_templates(user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prompts_updated_at ON prompts_templates;
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_generations_updated_at ON generations_history;
CREATE TRIGGER update_generations_updated_at BEFORE UPDATE ON generations_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vues utiles
CREATE OR REPLACE VIEW recent_generations AS
SELECT 
    id,
    user_id,
    SUBSTRING(generated_post, 1, 100) as preview,
    ton,
    is_safe,
    created_at
FROM generations_history
ORDER BY created_at DESC
LIMIT 50;

-- Statistiques par utilisateur
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    user_id,
    COUNT(*) as total_generations,
    COUNT(CASE WHEN is_safe = TRUE THEN 1 END) as safe_posts,
    COUNT(CASE WHEN is_safe = FALSE THEN 1 END) as flagged_posts,
    COUNT(CASE WHEN ton = 'professionnel' THEN 1 END) as professionnel_posts,
    COUNT(CASE WHEN ton = 'inspirant' THEN 1 END) as inspirant_posts,
    COUNT(CASE WHEN ton = 'engagé' THEN 1 END) as engage_posts,
    MAX(created_at) as last_generation
FROM generations_history
GROUP BY user_id;

COMMENT ON TABLE users IS 'Utilisateurs de l''application';
COMMENT ON TABLE prompts_templates IS 'Templates de prompts personnalisés par utilisateur';
COMMENT ON TABLE generations_history IS 'Historique complet des posts générés avec fact-checking';
COMMENT ON COLUMN generations_history.fact_check_result IS 'Résultat JSON du fact-checking';
COMMENT ON COLUMN generations_history.is_safe IS 'Indique si le post a passé le fact-checking';
