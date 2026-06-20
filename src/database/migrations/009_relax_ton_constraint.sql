-- Migration 009 : assouplir la contrainte legacy sur generations_history.ton
--
-- 'ton' était limité à professionnel|inspirant|engagé. Depuis l'architecture
-- entonnoir, le vrai concept est 'post_type'. On retire la contrainte rigide
-- pour ne plus bloquer les insertions (le ton n'est plus piloté par l'UI).

ALTER TABLE generations_history DROP CONSTRAINT IF EXISTS generations_history_ton_check;

-- On garde 'ton' en colonne libre (legacy), non contrainte.
COMMENT ON COLUMN generations_history.ton IS 'Legacy. Le concept actuel est post_type. Colonne libre, non contrainte.';
