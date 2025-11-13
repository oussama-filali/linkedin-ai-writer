const openai = require('../config/openai');
const promptTemplates = require('./prompts/linkedin-prompts');

class AIService {
    constructor() {
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }

    /**
     * Génère un post LinkedIn basé sur les inputs utilisateur
     * @param {Object} data - Données de l'utilisateur
     * @param {string} data.resume - Résumé LinkedIn de l'utilisateur
     * @param {string} data.objectif - Objectif du post
     * @param {string} data.ton - Ton souhaité (professionnel, inspirant, engagé)
     * @param {string} data.sujet - Sujet du post (optionnel)
     * @param {boolean} data.enableFactCheck - Active le fact-checking automatique (défaut: true)
     * @returns {Promise<string>} Le post généré
     */
    async generateLinkedInPost(data) {
        const { resume, objectif, ton, sujet = '', enableFactCheck = true } = data;

        // Validation
        if (!resume || !objectif || !ton) {
            throw new Error('Données manquantes : resume, objectif et ton sont requis');
        }

        // Construction du prompt avec engineering avancé
        const systemPrompt = promptTemplates.getSystemPrompt(ton);
        const userPrompt = promptTemplates.getUserPrompt(resume, objectif, sujet);

        let attempt = 0;
        let lastError;

        while (attempt < this.maxRetries) {
            try {
                const response = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 500,
                    presence_penalty: 0.6,
                    frequency_penalty: 0.5
                });

                const generatedPost = response.choices[0].message.content.trim();
                
                // Validation du contenu généré
                if (!this.validatePost(generatedPost)) {
                    throw new Error('Le post généré ne respecte pas les critères de qualité ou contient des hallucinations potentielles');
                }

                // Fact-checking optionnel mais recommandé
                if (enableFactCheck) {
                    const factChecker = require('./fact-checking/fact-checker');
                    const analysis = await factChecker.analyzeContent(generatedPost);
                    
                    if (analysis.riskLevel === 'élevé') {
                        console.warn('⚠️  ATTENTION : Le post contient des affirmations à risque');
                        console.warn('Affirmations détectées:', analysis.claims.map(c => c.text));
                        
                        // Si risque élevé, on suggère automatiquement une amélioration
                        const improved = await factChecker.suggestImprovements(generatedPost, analysis);
                        console.log('✅ Version améliorée proposée (sans hallucinations)');
                        return improved;
                    }
                }

                return generatedPost;
            } catch (error) {
                lastError = error;
                attempt++;
                
                console.error(`Tentative ${attempt}/${this.maxRetries} échouée:`, error.message);
                
                if (attempt < this.maxRetries) {
                    await this.sleep(this.retryDelay * attempt);
                }
            }
        }

        throw new Error(`Échec après ${this.maxRetries} tentatives: ${lastError.message}`);
    }

    /**
     * Valide qu'un post généré respecte les critères LinkedIn
     * @param {string} post - Le post à valider
     * @returns {boolean}
     */
    validatePost(post) {
        if (!post || post.length < 50) return false;
        if (post.length > 3000) return false; // LinkedIn limit
        
        // Vérification de mots-clés inappropriés
        const inappropriateKeywords = ['spam', 'click here', 'buy now'];
        const hasInappropriate = inappropriateKeywords.some(keyword => 
            post.toLowerCase().includes(keyword)
        );
        
        // Détection de potentielles hallucinations (statistiques inventées)
        const suspiciousPatterns = [
            /\d{2,3}%\s*(des|de|d')\s*(entreprises|personnes|professionnels)/i, // "85% des entreprises"
            /selon\s+une\s+étude\s+(de|récente|menée)/i, // "selon une étude de..."
            /une\s+étude\s+(montre|révèle|démontre)/i, // "une étude montre que"
            /(recherche|étude)\s+de\s+\d{4}/i, // "recherche de 2023"
            /\d{1,3}\s+milliards?\s+de\s+(dollars|euros)/i, // "5 milliards de dollars"
            /(harvard|mit|stanford|mckinsey)\s+(business\s+)?review/i // Citations d'études célèbres
        ];
        
        const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(post));
        
        if (hasSuspiciousContent) {
            console.warn('⚠️  ALERTE HALLUCINATION : Le post contient des données potentiellement inventées');
            console.warn('Post concerné:', post.substring(0, 200) + '...');
            return false;
        }
        
        return !hasInappropriate;
    }

    /**
     * Améliore un post existant
     * @param {string} originalPost - Le post original
     * @param {string} feedback - Le feedback utilisateur
     * @returns {Promise<string>}
     */
    async improvePost(originalPost, feedback) {
        const systemPrompt = `Tu es un rédacteur expert LinkedIn. Améliore le post en intégrant les retours de l'utilisateur, tout en gardant le même ton et le même esprit. Évite les structures trop formatées, les listes à puces ou numérotées, et les symboles ASCII. Privilégie un style fluide et naturel.`;
        
        const userPrompt = `Voici le post à améliorer :
${originalPost}

Retours de l'utilisateur :
${feedback}

Merci de réécrire ce post en tenant compte de ces retours.`;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.6,
                max_tokens: 500
            });

            return response.choices[0].message.content.trim();
        } catch (error) {
            throw new Error(`Erreur lors de l'amélioration du post: ${error.message}`);
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = new AIService();
