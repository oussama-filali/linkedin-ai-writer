const aiService = require('../../ia/ai-service');
const factChecker = require('../../ia/fact-checking/fact-checker');
const db = require('../../config/database');

class PostController {
    /**
     * Génère un nouveau post LinkedIn
     */
    async generatePost(req, res) {
        try {
            const { resume, objectif, ton, sujet, userId, profile } = req.body;

            // Validation : on accepte soit un profil structuré, soit un simple résumé texte
            if ((!profile && !resume) || !objectif || !ton) {
                return res.status(400).json({
                    success: false,
                    error: 'Données manquantes : profil/résumé, objectif et ton sont requis'
                });
            }

            // Générer le post
            const generatedPost = await aiService.generateLinkedInPost({
                profile,
                resume,
                objectif,
                ton,
                sujet
            });

            // Fact-checking automatique
            const factCheckResult = await factChecker.verifySafeToPublish(generatedPost);

            // Sauvegarder dans la base de données
            const result = await db.query(
                `INSERT INTO generations_history 
                (user_id, resume, objectif, ton, sujet, generated_post, fact_check_result, is_safe) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                RETURNING id, created_at`,
                [userId || null, resume, objectif, ton, sujet || null, generatedPost, JSON.stringify(factCheckResult), factCheckResult.safe]
            );

            res.json({
                success: true,
                data: {
                    id: result.rows[0].id,
                    post: generatedPost,
                    factCheck: factCheckResult,
                    createdAt: result.rows[0].created_at
                }
            });
        } catch (error) {
            console.error('Erreur génération post:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erreur lors de la génération du post'
            });
        }
    }

    /**
     * Améliore un post existant
     */
    async improvePost(req, res) {
        try {
            const { postId, feedback } = req.body;

            if (!postId || !feedback) {
                return res.status(400).json({
                    success: false,
                    error: 'postId et feedback sont requis'
                });
            }

            // Récupérer le post original
            const originalResult = await db.query(
                'SELECT generated_post FROM generations_history WHERE id = $1',
                [postId]
            );

            if (originalResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Post non trouvé'
                });
            }

            const originalPost = originalResult.rows[0].generated_post;

            // Améliorer le post
            const improvedPost = await aiService.improvePost(originalPost, feedback);

            // Fact-check du post amélioré
            const factCheckResult = await factChecker.verifySafeToPublish(improvedPost);

            // Mettre à jour dans la base de données
            await db.query(
                `UPDATE generations_history 
                SET improved_post = $1, improvement_feedback = $2, fact_check_result = $3, is_safe = $4, updated_at = NOW() 
                WHERE id = $5`,
                [improvedPost, feedback, JSON.stringify(factCheckResult), factCheckResult.safe, postId]
            );

            res.json({
                success: true,
                data: {
                    post: improvedPost,
                    factCheck: factCheckResult
                }
            });
        } catch (error) {
            console.error('Erreur amélioration post:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Erreur lors de l\'amélioration du post'
            });
        }
    }

    /**
     * Récupère l'historique des posts générés
     */
    async getHistory(req, res) {
        try {
            const { userId, limit = 20, offset = 0 } = req.query;

            let query = 'SELECT * FROM generations_history';
            const params = [];

            if (userId) {
                query += ' WHERE user_id = $1';
                params.push(userId);
            }

            query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
            params.push(limit, offset);

            const result = await db.query(query, params);

            res.json({
                success: true,
                data: result.rows,
                count: result.rows.length
            });
        } catch (error) {
            console.error('Erreur récupération historique:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la récupération de l\'historique'
            });
        }
    }

    /**
     * Récupère le détail d'un post par ID
     */
    async getPostById(req, res) {
        try {
            const { id } = req.params;
            const numericId = parseInt(id, 10);
            if (Number.isNaN(numericId)) {
                return res.status(400).json({ success: false, error: 'ID invalide' });
            }

            const result = await db.query('SELECT * FROM generations_history WHERE id = $1', [numericId]);
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, error: 'Post introuvable' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('Erreur getPostById:', error.message);
            res.status(500).json({ success: false, error: 'Impossible de récupérer le post' });
        }
    }

    /**
     * Vérifie le fact-checking d'un contenu personnalisé
     */
    async checkContent(req, res) {
        try {
            const { content } = req.body;

            if (!content) {
                return res.status(400).json({
                    success: false,
                    error: 'Le contenu est requis'
                });
            }

            const factCheckResult = await factChecker.verifySafeToPublish(content);

            // Si des améliorations sont suggérées
            let improvedContent = null;
            if (!factCheckResult.safe && factCheckResult.analysis) {
                improvedContent = await factChecker.suggestImprovements(content, factCheckResult.analysis);
            }

            res.json({
                success: true,
                data: {
                    original: content,
                    factCheck: factCheckResult,
                    improved: improvedContent
                }
            });
        } catch (error) {
            console.error('Erreur fact-checking:', error);
            res.status(500).json({
                success: false,
                error: 'Erreur lors de la vérification du contenu'
            });
        }
    }
}

module.exports = new PostController();
