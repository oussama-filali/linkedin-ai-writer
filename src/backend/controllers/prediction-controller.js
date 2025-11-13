const predictiveService = require('../../ia/ai-predictive-service');
const contentFilter = require('../../ia/content-filter');
const factChecker = require('../../ia/fact-checking/fact-checker');
const db = require('../../config/database');

/**
 * Contrôleur pour les fonctionnalités prédictives et de validation
 */
class PredictionController {
    /**
     * Prédit les performances d'un post LinkedIn
     * POST /api/posts/predict
     */
    async predictPerformance(req, res) {
        try {
            const { content, context } = req.body;

            if (!content) {
                return res.status(400).json({
                    success: false,
                    error: 'Le contenu est requis'
                });
            }

            // 1. Vérification du filtre de contenu
            const filterResult = contentFilter.validate(content);
            
            if (!filterResult.valid) {
                return res.status(400).json({
                    success: false,
                    error: 'Contenu non conforme aux standards professionnels',
                    violations: filterResult.violations,
                    recommendation: filterResult.recommendation
                });
            }

            // 2. Analyse prédictive
            const prediction = await predictiveService.predictPerformance(content, context || {});

            // 3. Fact-checking automatique
            const factCheckResult = await factChecker.verifySafeToPublish(content);

            // 4. Sauvegarde dans la base de données
            await db.query(
                `INSERT INTO predictions_analytics 
                (content, prediction_data, fact_check_result, filter_score, user_id) 
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    content, 
                    JSON.stringify(prediction), 
                    JSON.stringify(factCheckResult),
                    filterResult.score,
                    req.body.userId || null
                ]
            );

            res.json({
                success: true,
                data: {
                    prediction,
                    factCheck: factCheckResult,
                    contentQuality: {
                        professionalScore: filterResult.score,
                        warnings: filterResult.warnings
                    }
                }
            });

        } catch (error) {
            console.error('Erreur prédiction:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erreur lors de l\'analyse prédictive'
            });
        }
    }

    /**
     * Vérifie un contenu (fact-checking + filtre)
     * POST /api/posts/verify
     */
    async verifyContent(req, res) {
        try {
            const { content } = req.body;

            if (!content) {
                return res.status(400).json({
                    success: false,
                    error: 'Le contenu est requis'
                });
            }

            // 1. Validation du filtre
            const filterResult = contentFilter.validate(content);

            // 2. Fact-checking multi-sources
            const factCheckResult = await factChecker.verifySafeToPublish(content);

            // 3. Génération de contenu amélioré si nécessaire
            let improvedContent = null;
            if (!filterResult.valid || !factCheckResult.safe) {
                // Auto-nettoyage du contenu
                const cleanResult = contentFilter.autoClean(content);
                
                if (cleanResult.improved && !factCheckResult.safe && factCheckResult.analysis) {
                    improvedContent = await factChecker.suggestImprovements(
                        cleanResult.cleaned,
                        factCheckResult.analysis
                    );
                } else if (cleanResult.improved) {
                    improvedContent = cleanResult.cleaned;
                }
            }

            res.json({
                success: true,
                data: {
                    original: content,
                    validation: {
                        professional: filterResult.professional,
                        professionalScore: filterResult.score,
                        violations: filterResult.violations,
                        warnings: filterResult.warnings
                    },
                    factCheck: factCheckResult,
                    improved: improvedContent,
                    readyToPublish: filterResult.valid && factCheckResult.safe
                }
            });

        } catch (error) {
            console.error('Erreur vérification:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erreur lors de la vérification'
            });
        }
    }

    /**
     * Compare plusieurs variantes d'un post
     * POST /api/posts/compare
     */
    async compareVariants(req, res) {
        try {
            const { variants, context } = req.body;

            if (!Array.isArray(variants) || variants.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Au moins 2 variantes sont requises'
                });
            }

            // Filtrage des variantes non conformes
            const validVariants = variants.filter(v => {
                const filterResult = contentFilter.validate(v);
                return filterResult.valid;
            });

            if (validVariants.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Au moins 2 variantes conformes requises après filtrage'
                });
            }

            // Comparaison prédictive
            const comparison = await predictiveService.compareVariants(validVariants, context || {});

            res.json({
                success: true,
                data: comparison
            });

        } catch (error) {
            console.error('Erreur comparaison:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erreur lors de la comparaison'
            });
        }
    }

    /**
     * Analyse le meilleur timing de publication
     * POST /api/posts/timing
     */
    async analyzeTiming(req, res) {
        try {
            const { content, audienceData } = req.body;

            if (!content) {
                return res.status(400).json({
                    success: false,
                    error: 'Le contenu est requis'
                });
            }

            const timingAnalysis = await predictiveService.analyzeBestTiming(
                content,
                audienceData || {}
            );

            res.json({
                success: true,
                data: timingAnalysis
            });

        } catch (error) {
            console.error('Erreur analyse timing:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erreur lors de l\'analyse du timing'
            });
        }
    }
}

module.exports = new PredictionController();
