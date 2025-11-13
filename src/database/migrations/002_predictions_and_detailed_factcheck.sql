-- Migration 002: Tables additionnelles pour prédictions et fact-checking détaillé
-- Créé le: 2025-11-13

-- Table des analyses prédictives de performances
CREATE TABLE IF NOT EXISTS predictions_analytics (
    id SERIAL PRIMARY KEY,
    generation_id INTEGER REFERENCES generations_history(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    prediction_data JSONB NOT NULL,
    engagement_score INTEGER CHECK (engagement_score BETWEEN 0 AND 100),
    virality_potential VARCHAR(20) CHECK (virality_potential IN ('faible', 'moyen', 'élevé', 'viral')),
    optimal_posting_time JSONB,
    recommendations JSONB DEFAULT '[]',
    filter_score INTEGER,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table détaillée des fact-checks
CREATE TABLE IF NOT EXISTS fact_checks_detailed (
    id SERIAL PRIMARY KEY,
    generation_id INTEGER REFERENCES generations_history(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    claims JSONB DEFAULT '[]',
    risk_level VARCHAR(20) CHECK (risk_level IN ('faible', 'moyen', 'élevé', 'critique')),
    safe BOOLEAN DEFAULT true,
    warnings JSONB DEFAULT '[]',
    recommendations JSONB DEFAULT '[]',
    sources_verified INTEGER DEFAULT 0,
    google_fact_check_results JSONB,
    ai_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des comparaisons de variantes de posts
CREATE TABLE IF NOT EXISTS post_variants_comparison (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    variant_1_content TEXT NOT NULL,
    variant_2_content TEXT,
    variant_3_content TEXT,
    comparison_results JSONB NOT NULL,
    best_variant INTEGER CHECK (best_variant IN (1, 2, 3)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table d'analyse de timing optimal
CREATE TABLE IF NOT EXISTS posting_timing_analysis (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    industry VARCHAR(100),
    target_audience JSONB,
    recommended_times JSONB NOT NULL,
    reasoning TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_predictions_generation ON predictions_analytics(generation_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fact_checks_detailed_generation ON fact_checks_detailed(generation_id);
CREATE INDEX IF NOT EXISTS idx_fact_checks_detailed_risk ON fact_checks_detailed(risk_level);
CREATE INDEX IF NOT EXISTS idx_fact_checks_detailed_safe ON fact_checks_detailed(safe);
CREATE INDEX IF NOT EXISTS idx_variants_user ON post_variants_comparison(user_id);
CREATE INDEX IF NOT EXISTS idx_timing_user ON posting_timing_analysis(user_id);

-- Vue agrégée des performances prédites
CREATE OR REPLACE VIEW predictions_summary AS
SELECT 
    p.id,
    p.generation_id,
    g.ton,
    p.engagement_score,
    p.virality_potential,
    f.risk_level,
    f.safe as fact_check_safe,
    p.created_at
FROM predictions_analytics p
LEFT JOIN generations_history g ON p.generation_id = g.id
LEFT JOIN fact_checks_detailed f ON f.generation_id = g.id
ORDER BY p.created_at DESC;

-- Vue des posts à haut risque
CREATE OR REPLACE VIEW high_risk_posts AS
SELECT 
    g.id,
    g.user_id,
    g.ton,
    SUBSTRING(g.generated_post, 1, 100) as preview,
    f.risk_level,
    f.warnings,
    f.recommendations,
    g.created_at
FROM generations_history g
INNER JOIN fact_checks_detailed f ON f.generation_id = g.id
WHERE f.risk_level IN ('élevé', 'critique') OR f.safe = false
ORDER BY g.created_at DESC;

-- Commentaires sur les nouvelles tables
COMMENT ON TABLE predictions_analytics IS 'Analyses prédictives des performances potentielles des posts';
COMMENT ON TABLE fact_checks_detailed IS 'Résultats détaillés et enrichis du fact-checking';
COMMENT ON TABLE post_variants_comparison IS 'Comparaisons entre différentes variantes d''un même post';
COMMENT ON TABLE posting_timing_analysis IS 'Analyses du timing optimal de publication';

COMMENT ON COLUMN predictions_analytics.engagement_score IS 'Score d''engagement prédit (0-100)';
COMMENT ON COLUMN predictions_analytics.virality_potential IS 'Potentiel de viralité du post';
COMMENT ON COLUMN fact_checks_detailed.claims IS 'Array des affirmations identifiées dans le contenu';
COMMENT ON COLUMN fact_checks_detailed.google_fact_check_results IS 'Résultats bruts de l''API Google Fact Check';

-- Log de la migration
DO $$
BEGIN
    RAISE NOTICE 'Migration 002 complétée: Tables prédictions et fact-checking détaillé créées';
END $$;
