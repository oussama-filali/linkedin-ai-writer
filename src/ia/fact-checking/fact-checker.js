const axios = require('axios');
const openai = require('../../config/openai');

/**
 * Prompt d'analyse fact-checking (auparavant dans linkedin-prompts.js).
 * Demande au modèle de repérer les affirmations vérifiables en JSON.
 */
function getFactCheckPrompt(content) {
    return `Analyse ce contenu et repère les affirmations qui pourraient nécessiter une vérification :

${content}

Pour chaque affirmation douteuse ou vérifiable, note l'affirmation elle-même, la raison pour laquelle elle pourrait être problématique, ton niveau de confiance dans sa véracité, et sa catégorie.

Réponds uniquement en JSON avec cette structure :
{
    "claims": [
        {
            "text": "l'affirmation concernée",
            "reason": "pourquoi cela mérite vérification",
            "confidence": "faible|moyen|élevé",
            "category": "statistique|fait historique|étude|autre"
        }
    ],
    "needsVerification": true/false,
    "riskLevel": "faible|moyen|élevé"
}`;
}

/**
 * Service avancé de fact-checking multi-sources
 * Vérifie les affirmations via Google Fact Check, Wikidata et analyses IA
 */
class FactCheckingService {
    constructor() {
        this.googleFactCheckApiKey = process.env.GOOGLE_FACT_CHECK_API_KEY;
        this.factCheckApiUrl = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';
        this.wikidataApiUrl = 'https://www.wikidata.org/w/api.php';
        this.maxRetries = 2;
        
        // Sources reconnues pour fact-checking
        this.trustedSources = [
            'AFP Factuel', 'Reuters', 'Le Monde Décodeurs', 
            'Libération CheckNews', 'France Info', 'Associated Press',
            'PolitiFact', 'FactCheck.org', 'Snopes'
        ];
    }

    /**
     * Analyse un texte et identifie les affirmations à vérifier
     * @param {string} content - Le contenu à analyser
     * @returns {Promise<Object>} Analyse des affirmations
     */
    async analyzeContent(content) {
        try {
            const prompt = getFactCheckPrompt(content);
            
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { 
                        role: 'system', 
                        content: 'Tu es un expert en vérification factuelle. Analyse le contenu et repère les affirmations qui nécessitent une vérification.'
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3, // Basse température pour plus de précision
                response_format: { type: 'json_object' }
            });

            const analysis = JSON.parse(response.choices[0].message.content);
            
            // Vérifier les claims identifiées avec Google Fact Check API + Wikidata
            if (analysis.claims && analysis.claims.length > 0) {
                analysis.claims = await Promise.all(
                    analysis.claims.map(claim => this.verifyClaimMultiSource(claim))
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
                },
                headers: {
                    // Certaines confs Google exigent l'en-tête explicite
                    'X-Goog-Api-Key': this.googleFactCheckApiKey
                },
                timeout: 5000
            });

            if (response.data.claims && response.data.claims.length > 0) {
                const factCheck = response.data.claims[0];
                const claimReview = factCheck.claimReview?.[0];
                
                claim.googleFactCheck = {
                    available: true,
                    claimReview: claimReview,
                    rating: claimReview?.textualRating,
                    ratingValue: this._normalizeRating(claimReview?.textualRating),
                    source: claimReview?.publisher?.name,
                    url: claimReview?.url,
                    isTrustedSource: this.trustedSources.includes(claimReview?.publisher?.name)
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
     * Vérifie une affirmation via Wikidata
     * @param {Object} claim - L'affirmation à vérifier
     * @returns {Promise<Object>} Données Wikidata si disponibles
     */
    async verifyClaimWithWikidata(claim) {
        try {
            // On cherche l'ENTITÉ nommée (ex: "Ibn Khaldoun"), pas la phrase entière.
            // Une recherche sur la phrase complète renvoie toujours noResults.
            const searchTerm = this._extractEntity(claim.text) || claim.text;

            // Recherche d'entités correspondantes
            const searchResponse = await axios.get(this.wikidataApiUrl, {
                params: {
                    action: 'wbsearchentities',
                    search: searchTerm,
                    language: 'fr',
                    format: 'json',
                    limit: 3
                },
                headers: {
                    // Wikidata exige un User-Agent explicite, sinon 403 Forbidden.
                    'User-Agent': 'LinkedInAIWriter/1.0 (fact-checking; contact: support@linkedin-ai-writer.app)',
                    'Accept': 'application/json'
                },
                timeout: 5000
            });

            if (searchResponse.data.search && searchResponse.data.search.length > 0) {
                const entities = searchResponse.data.search.map(entity => ({
                    id: entity.id,
                    label: entity.label,
                    description: entity.description,
                    url: `https://www.wikidata.org/wiki/${entity.id}`
                }));

                claim.wikidataCheck = {
                    available: true,
                    entities,
                    hasMatch: true
                };
            } else {
                claim.wikidataCheck = { available: true, noResults: true };
            }
        } catch (error) {
            console.error('Erreur Wikidata API:', error.message);
            claim.wikidataCheck = { available: true, error: error.message };
        }

        return claim;
    }

    /**
     * Extrait l'entité nommée la plus probable d'une affirmation : la plus longue
     * séquence de mots commençant par une majuscule (ex: "Ibn Khaldoun", "Marie Curie").
     * Permet une recherche Wikidata ciblée au lieu de la phrase entière.
     * @private
     * @param {string} text
     * @returns {string|null}
     */
    _extractEntity(text) {
        if (!text) return null;
        // Séquences de mots capitalisés (gère accents et particules courtes type "de", "ibn")
        const matches = text.match(/\b([A-ZÀ-Ý][\wÀ-ÿ'-]+(?:\s+(?:de|du|d'|von|van|ibn|al|el)?\s*[A-ZÀ-Ý][\wÀ-ÿ'-]+)*)/g);
        if (!matches || matches.length === 0) return null;
        // On retient la plus longue (souvent le nom propre complet)
        return matches.sort((a, b) => b.length - a.length)[0].trim();
    }

    /**
     * Normalise les ratings de différentes sources
     * @private
     */
    _normalizeRating(rating) {
        if (!rating) return 0;
        
        const ratingLower = rating.toLowerCase();
        
        if (ratingLower.includes('true') || ratingLower.includes('vrai')) return 10;
        if (ratingLower.includes('mostly true') || ratingLower.includes('plutôt vrai')) return 8;
        if (ratingLower.includes('half true') || ratingLower.includes('mitigé')) return 5;
        if (ratingLower.includes('mostly false') || ratingLower.includes('plutôt faux')) return 3;
        if (ratingLower.includes('false') || ratingLower.includes('faux')) return 0;
        
        return 5; // Neutre par défaut
    }

    /**
     * Vérifie une affirmation via sources multiples (Google + Wikidata)
     * @param {Object} claim - L'affirmation à vérifier
     * @returns {Promise<Object>} Résultats combinés
     */
    async verifyClaimMultiSource(claim) {
        // Vérification parallèle sur les deux sources
        const [googleResult, wikidataResult] = await Promise.allSettled([
            this.verifyClaimWithGoogle(claim),
            this.verifyClaimWithWikidata(claim)
        ]);

        // Fusion des résultats
        const enrichedClaim = { ...claim };
        
        if (googleResult.status === 'fulfilled') {
            Object.assign(enrichedClaim, googleResult.value);
        }
        
        if (wikidataResult.status === 'fulfilled') {
            Object.assign(enrichedClaim, wikidataResult.value);
        }

        // Score de confiance global
        enrichedClaim.confidenceScore = this._calculateConfidenceScore(enrichedClaim);
        
        return enrichedClaim;
    }

    /**
     * Calcule un score de confiance basé sur les vérifications
     * @private
     */
    _calculateConfidenceScore(claim) {
        let score = 5; // Neutre par défaut

        // Bonus si vérifié par Google avec source fiable
        if (claim.googleFactCheck?.available && claim.googleFactCheck.isTrustedSource) {
            score = claim.googleFactCheck.ratingValue || score;
        }

        // Bonus si présent dans Wikidata
        if (claim.wikidataCheck?.hasMatch) {
            score += 2;
        }

        // Plafonnement
        return Math.min(10, Math.max(0, score));
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
            result.warnings.push('Le contenu contient des affirmations qui nécessitent vérification');
        }

        if (analysis.needsVerification && analysis.claims.length > 0) {
            const unverifiedClaims = analysis.claims.filter(
                c => !c.googleFactCheck || c.googleFactCheck.noResults
            );

            if (unverifiedClaims.length > 0) {
                result.warnings.push(
                    `${unverifiedClaims.length} affirmation(s) non vérifiable(s) détectée(s)`
                );
                result.recommendations.push(
                    'Reformulez en tant qu\'expérience personnelle ou ajoutez des sources vérifiables'
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

        const improvementPrompt = `Voici le contenu original :
${content}

Affirmations qui posent problème :
${analysis.claims.map((c, i) => `${i + 1}. "${c.text}" - ${c.reason}`).join('\n')}

Réécris ce texte en suivant ces principes :
• Transforme les affirmations non vérifiées en observations personnelles (utilise "d'après mon expérience", "j'ai constaté que", etc.)
• Garde le même ton et le même message
• Conserve l'authenticité et l'engagement
• Ajoute des nuances appropriées

Donne-moi la version améliorée.`;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { 
                        role: 'system', 
                        content: 'Tu es un expert en rédaction factuelle. Améliore le contenu pour le rendre plus véridique tout en préservant son impact et son naturel.'
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
