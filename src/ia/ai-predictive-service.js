const openai = require('../config/openai');

/**
 * Service d'analyse prédictive des performances LinkedIn
 * Évalue la qualité, l'engagement potentiel et la viralité d'un post
 */
class AIPredictiveService {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    /**
     * Prédit les performances probables d'un post LinkedIn
     * @param {string} content - Contenu du post à analyser
     * @param {Object} context - Contexte additionnel (secteur, audience cible)
     * @returns {Promise<Object>} Prédictions détaillées
     */
    async predictPerformance(content, context = {}) {
        if (!content || content.length < 50) {
            throw new Error('Contenu trop court pour analyse prédictive');
        }

        const analysisPrompt = this._buildAnalysisPrompt(content, context);

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: `Tu es un expert en analyse de contenu LinkedIn avec une décennie d'expérience. Évalue les posts avec objectivité en te basant sur les patterns d'engagement réels de la plateforme. Fournis une analyse en JSON pur, sans fioritures.`
                    },
                    {
                        role: 'user',
                        content: analysisPrompt
                    }
                ],
                temperature: 0.3, // Basse température pour réponses plus déterministes
                max_tokens: 800
            });

            const rawPrediction = response.choices[0].message.content.trim();
            const prediction = JSON.parse(rawPrediction);

            // Validation et enrichissement
            return this._validateAndEnrichPrediction(prediction, content);

        } catch (error) {
            console.error('Erreur analyse prédictive:', error);
            throw new Error(`Échec de l'analyse prédictive: ${error.message}`);
        }
    }

    /**
     * Construit le prompt d'analyse
     * @private
     */
    _buildAnalysisPrompt(content, context) {
        return `Analyse ce post LinkedIn et estime son potentiel d'engagement.

Voici le post :
"""
${content}
"""

Contexte de publication :
• Secteur : ${context.industry || 'Non spécifié'}
• Audience : ${context.targetAudience || 'Professionnels généralistes'}
• Réseau : ${context.connectionsCount || 500} connexions

Retourne ton analyse sous forme de JSON avec exactement cette structure :

{
  "overallScore": <nombre entre 0 et 100>,
  "predictedMetrics": {
    "estimatedLikes": <nombre>,
    "estimatedComments": <nombre>,
    "estimatedShares": <nombre>,
    "estimatedReach": <nombre>,
    "engagementRate": <pourcentage>
  },
  "qualityAnalysis": {
    "clarity": <0-10>,
    "relevance": <0-10>,
    "valueProposition": <0-10>,
    "callToAction": <0-10>,
    "storytelling": <0-10>
  },
  "strengths": [
    "première force identifiée",
    "deuxième force identifiée",
    "troisième force identifiée"
  ],
  "weaknesses": [
    "première faiblesse à corriger",
    "deuxième faiblesse à corriger"
  ],
  "viralityFactors": {
    "hasHook": <true/false>,
    "emotionalImpact": <"low"/"medium"/"high">,
    "shareability": <0-10>,
    "controversyRisk": <"low"/"medium"/"high">
  },
  "improvements": [
    "première suggestion d'amélioration",
    "deuxième suggestion d'amélioration",
    "troisième suggestion d'amélioration"
  ],
  "optimalPublicationTime": "jour et créneau horaire recommandés",
  "targetAudienceMatch": <pourcentage>
}`;
    }

    /**
     * Valide et enrichit les prédictions
     * @private
     */
    _validateAndEnrichPrediction(prediction, content) {
        // Ajout de métadonnées
        const enriched = {
            ...prediction,
            analysis: {
                contentLength: content.length,
                hasHashtags: (content.match(/#\w+/g) || []).length > 0,
                hashtagsCount: (content.match(/#\w+/g) || []).length,
                hasEmojis: /[\u{1F600}-\u{1F64F}]/u.test(content),
                hasQuestion: content.includes('?'),
                hasCallToAction: /\b(cliquez|commentez|partagez|découvrez|contactez)\b/i.test(content),
                wordCount: content.split(/\s+/).length,
                readingTime: Math.ceil(content.split(/\s+/).length / 200) // mots par minute
            },
            verdict: this._generateVerdict(prediction.overallScore),
            timestamp: new Date().toISOString()
        };

        return enriched;
    }

    /**
     * Génère un verdict basé sur le score
     * @private
     */
    _generateVerdict(score) {
        if (score >= 85) return 'Excellent potentiel viral';
        if (score >= 70) return 'Très bon engagement attendu';
        if (score >= 55) return 'Performance solide';
        if (score >= 40) return 'Améliorations nécessaires';
        return 'Révision recommandée';
    }

    /**
     * Compare plusieurs variantes d'un post
     * @param {Array<string>} variants - Différentes versions du post
     * @param {Object} context - Contexte commun
     * @returns {Promise<Object>} Comparaison détaillée
     */
    async compareVariants(variants, context = {}) {
        if (!Array.isArray(variants) || variants.length < 2) {
            throw new Error('Au moins 2 variantes sont requises pour comparaison');
        }

        const predictions = await Promise.all(
            variants.map((content, index) =>
                this.predictPerformance(content, context)
                    .then(pred => ({ index, content, ...pred }))
            )
        );

        // Tri par score décroissant
        predictions.sort((a, b) => b.overallScore - a.overallScore);

        return {
            winner: predictions[0],
            allVariants: predictions,
            recommendation: `La variante ${predictions[0].index + 1} offre le meilleur potentiel avec un score de ${predictions[0].overallScore}/100`,
            comparison: this._generateComparison(predictions)
        };
    }

    /**
     * Génère une comparaison détaillée
     * @private
     */
    _generateComparison(predictions) {
        return {
            bestClarity: predictions.reduce((max, p) => 
                p.qualityAnalysis.clarity > max.qualityAnalysis.clarity ? p : max
            ).index,
            bestEngagement: predictions.reduce((max, p) => 
                p.predictedMetrics.engagementRate > max.predictedMetrics.engagementRate ? p : max
            ).index,
            bestReach: predictions.reduce((max, p) => 
                p.predictedMetrics.estimatedReach > max.predictedMetrics.estimatedReach ? p : max
            ).index
        };
    }

    /**
     * Analyse le meilleur timing de publication
     * @param {string} content - Contenu du post
     * @param {Object} audienceData - Données d'audience (timezone, profession)
     * @returns {Promise<Object>} Recommandations de timing
     */
    async analyzeBestTiming(content, audienceData = {}) {
        const baseRecommendations = this._getBaseTimingRecommendations(audienceData);

        return {
            optimal: baseRecommendations.optimal,
            good: baseRecommendations.good,
            avoid: baseRecommendations.avoid,
            reasoning: baseRecommendations.reasoning,
            timezone: audienceData.timezone || 'UTC+1 (Paris)',
            contentType: this._detectContentType(content)
        };
    }

    /**
     * Détecte le type de contenu
     * @private
     */
    _detectContentType(content) {
        const lower = content.toLowerCase();
        
        if (/\b(conseil|astuce|tip|guide)\b/i.test(content)) return 'educational';
        if (/\b(fierté|réussite|annonce|heureux)\b/i.test(content)) return 'announcement';
        if (/\b(question|avis|pensez-vous)\b/i.test(content)) return 'discussion';
        if (/\b(recrute|poste|opportunité)\b/i.test(content)) return 'recruitment';
        if (/\b(article|étude|recherche)\b/i.test(content)) return 'thought-leadership';
        
        return 'general';
    }

    /**
     * Recommandations de timing basées sur les données LinkedIn
     * @private
     */
    _getBaseTimingRecommendations(audienceData) {
        const contentType = audienceData.contentType || 'general';
        
        // Données basées sur études LinkedIn 2024
        const timingMap = {
            educational: {
                optimal: ['Mardi 8h-9h', 'Mercredi 12h-13h', 'Jeudi 10h-11h'],
                good: ['Lundi 9h-11h', 'Mercredi 16h-17h'],
                avoid: ['Vendredi après 15h', 'Week-end'],
                reasoning: 'Le contenu éducatif performe mieux en début de semaine, notamment pendant les pauses'
            },
            announcement: {
                optimal: ['Lundi 9h-10h', 'Jeudi 8h-9h'],
                good: ['Mardi 9h-11h', 'Mercredi 9h-10h'],
                avoid: ['Vendredi', 'Week-end'],
                reasoning: 'Les annonces captent mieux lattention en début de semaine'
            },
            discussion: {
                optimal: ['Mardi 12h-14h', 'Mercredi 12h-14h'],
                good: ['Lundi 13h-15h', 'Jeudi 12h-14h'],
                avoid: ['Lundi matin', 'Vendredi après-midi'],
                reasoning: 'Les questions engagent davantage pendant les pauses déjeuner'
            },
            general: {
                optimal: ['Mardi 9h-11h', 'Mercredi 12h-13h', 'Jeudi 9h-11h'],
                good: ['Lundi 10h-12h', 'Vendredi 8h-10h'],
                avoid: ['Week-end', 'Après 18h en semaine'],
                reasoning: 'Le milieu de semaine offre le meilleur engagement global'
            }
        };

        return timingMap[contentType] || timingMap.general;
    }
}

module.exports = new AIPredictiveService();
