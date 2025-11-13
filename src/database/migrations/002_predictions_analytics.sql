-- Migration pour l'analyse prédictive et le tracking
-- Version: 002
-- Date: 2025-11-13

-- Table pour les analyses prédictives
CREATE TABLE IF NOT EXISTS predictions_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    prediction_data JSONB NOT NULL, -- Stocke toutes les prédictions (likes, portée, etc.)
    fact_check_result JSONB, -- Résultats du fact-checking multi-sources
    filter_score INTEGER DEFAULT 100, -- Score de professionnalisme (0-100)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour performances
CREATE INDEX idx_predictions_user ON predictions_analytics(user_id);
CREATE INDEX idx_predictions_created ON predictions_analytics(created_at DESC);
CREATE INDEX idx_predictions_score ON predictions_analytics(filter_score DESC);

-- Index GIN pour recherche JSON
CREATE INDEX idx_predictions_data ON predictions_analytics USING GIN (prediction_data);
CREATE INDEX idx_fact_check_data ON predictions_analytics USING GIN (fact_check_result);

-- Ajout de colonnes à la table generations_history existante
ALTER TABLE generations_history ADD COLUMN IF NOT EXISTS prediction_score INTEGER;
ALTER TABLE generations_history ADD COLUMN IF NOT EXISTS content_filter_score INTEGER DEFAULT 100;
ALTER TABLE generations_history ADD COLUMN IF NOT EXISTS multi_source_verified BOOLEAN DEFAULT FALSE;

-- Table pour le tracking des sources de fact-checking
CREATE TABLE IF NOT EXISTS fact_check_sources (
    id SERIAL PRIMARY KEY,
    generation_id INTEGER REFERENCES generations_history(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL, -- 'google', 'wikidata', 'manual'
    claim_text TEXT NOT NULL,
    verification_result JSONB NOT NULL,
    confidence_score INTEGER, -- 0-10
    is_trusted_source BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fact_sources_generation ON fact_check_sources(generation_id);
CREATE INDEX idx_fact_sources_confidence ON fact_check_sources(confidence_score DESC);

-- Table pour les comparaisons de variantes
CREATE TABLE IF NOT EXISTS variant_comparisons (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    variants JSONB NOT NULL, -- Array de variantes avec leurs scores
    winner_index INTEGER,
    comparison_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comparisons_user ON variant_comparisons(user_id);

-- Commentaires pour documentation
COMMENT ON TABLE predictions_analytics IS 'Stocke les analyses prédictives de performance des posts LinkedIn';
COMMENT ON TABLE fact_check_sources IS 'Traçabilité des vérifications multi-sources';
COMMENT ON TABLE variant_comparisons IS 'Historique des comparaisons A/B de variantes';

COMMENT ON COLUMN predictions_analytics.prediction_data IS 'JSON contenant: overallScore, predictedMetrics, qualityAnalysis, etc.';
COMMENT ON COLUMN predictions_analytics.filter_score IS 'Score de professionnalisme: 100=parfait, 0=non conforme';
COMMENT ON COLUMN fact_check_sources.confidence_score IS 'Score de confiance 0-10 basé sur sources multiples';
