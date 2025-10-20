const axios = require('axios');
const openai = require('../../config/openai');
const promptTemplates = require('../prompts/linkedin-prompts');

class FactCheckingService {
    constructor() {
        this.googleFactCheckApiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;
        this.factCheckApiUrl = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';
    }

    /**
     * Analyse un texte et identifie les affirmations à vérifier
     * @param {string} content - Le contenu à analyser
     * @returns {Promise<Object>} Analyse des affirmations
     */
    async analyzeContent(content) {
        try {
            const prompt = promptTemplates.getFactCheckPrompt(content);
            
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { 
                        role: 'system', 
                        content: 'Tu es un expert en fact-checking. Analyse le contenu et identifie les affirmations factuelles à vérifier.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3, // Basse température pour plus de précision
                response_format: { type: 'json_object' }
            });

            const analysis = JSON.parse(response.choices[0].message.content);
            
            // Vérifier les claims identifiées avec Google Fact Check API si disponible
            if (this.googleFactCheckApiKey && analysis.claims && analysis.claims.length > 0) {
                analysis.claims = await Promise.all(
                    analysis.claims.map(claim => this.verifyClaimWithGoogle(claim))
                );
            }

            return analysis;
        } catch (error) {
            console.error('Erreur lors de l\'analyse du contenu:', error.message);
            throw new Error(`Fact-checking échoué: ${error.message}`);
        }
    }

    /**
     * Vérifie une affirmation avec Google Fact Check API
     * @param {Object} claim - L'affirmation à vérifier
     * @returns {Promise<Object>} Affirmation avec résultats de vérification
     */
    async verifyClaimWithGoogle(claim) {
        if (!this.googleFactCheckApiKey) {
            claim.googleFactCheck = { available: false };
            return claim;
        }

        try {
            const response = await axios.get(this.factCheckApiUrl, {
                params: {
                    key: this.googleFactCheckApiKey,
                    query: claim.text,
                    languageCode: 'fr'
                }
            });

            if (response.data.claims && response.data.claims.length > 0) {
                const factCheck = response.data.claims[0];
                claim.googleFactCheck = {
                    available: true,
                    claimReview: factCheck.claimReview?.[0],
                    rating: factCheck.claimReview?.[0]?.textualRating,
                    source: factCheck.claimReview?.[0]?.publisher?.name
                };
            } else {
                claim.googleFactCheck = { available: true, noResults: true };
            }
        } catch (error) {
            console.error('Erreur Google Fact Check API:', error.message);
            claim.googleFactCheck = { available: true, error: error.message };
        }

        return claim;
    }

    /**
     * Vérifie si un contenu est sûr à publier
     * @param {string} content - Le contenu à vérifier
     * @returns {Promise<Object>} Résultat de la vérification
     */
    async verifySafeToPublish(content) {
        const analysis = await this.analyzeContent(content);
        
        const result = {
            safe: true,
            warnings: [],
            recommendations: [],
            analysis
        };

        // Évaluer le niveau de risque
        if (analysis.riskLevel === 'élevé') {
            result.safe = false;
            result.warnings.push('Contenu à haut risque : contient des affirmations non vérifiées');
        }

        if (analysis.needsVerification && analysis.claims.length > 0) {
            const unverifiedClaims = analysis.claims.filter(
                c => !c.googleFactCheck || c.googleFactCheck.noResults
            );

            if (unverifiedClaims.length > 0) {
                result.warnings.push(
                    `${unverifiedClaims.length} affirmation(s) non vérifiée(s) détectée(s)`
                );
                result.recommendations.push(
                    'Reformulez les affirmations en tant qu\'opinions personnelles ou ajoutez des sources'
                );
            }
        }

        return result;
    }

    /**
     * Suggère des améliorations pour rendre le contenu plus factuel
     * @param {string} content - Le contenu original
     * @param {Object} analysis - L'analyse fact-checking
     * @returns {Promise<string>} Version améliorée du contenu
     */
    async suggestImprovements(content, analysis) {
        if (!analysis.needsVerification || analysis.claims.length === 0) {
            return content; // Aucune amélioration nécessaire
        }

        const improvementPrompt = `Contenu original:
${content}

Affirmations problématiques identifiées:
${analysis.claims.map((c, i) => `${i + 1}. "${c.text}" - ${c.reason}`).join('\n')}

Réécris ce contenu en:
1. Transformant les affirmations factuelles non vérifiées en opinions personnelles ("d'après mon expérience", "j'ai observé que")
2. Gardant le même ton et message global
3. Maintenant l'engagement et l'authenticité
4. Ajoutant des nuances appropriées

Contenu amélioré:`;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { 
                        role: 'system', 
                        content: 'Tu es un expert en rédaction factuelle. Améliore le contenu pour le rendre plus véridique sans perdre son impact.'
                    },
                    { role: 'user', content: improvementPrompt }
                ],
                temperature: 0.6,
                max_tokens: 600
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error('Erreur lors de l\'amélioration:', error.message);
            return content; // Retourner l'original en cas d'erreur
        }
    }
}

module.exports = new FactCheckingService();
