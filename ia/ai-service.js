const openai = require('../../config/openai');
const promptTemplates = require('../prompts/linkedin-prompts');

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
     * @returns {Promise<string>} Le post généré
     */
    async generateLinkedInPost(data) {
        const { resume, objectif, ton, sujet = '' } = data;

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
                    throw new Error('Le post généré ne respecte pas les critères de qualité');
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
        
        return !hasInappropriate;
    }

    /**
     * Améliore un post existant
     * @param {string} originalPost - Le post original
     * @param {string} feedback - Le feedback utilisateur
     * @returns {Promise<string>}
     */
    async improvePost(originalPost, feedback) {
        const systemPrompt = `Tu es un expert en rédaction LinkedIn. Améliore le post suivant en tenant compte du feedback utilisateur. Garde le même ton et structure.`;
        
        const userPrompt = `Post original:\n${originalPost}\n\nFeedback:\n${feedback}\n\nPost amélioré:`;

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
