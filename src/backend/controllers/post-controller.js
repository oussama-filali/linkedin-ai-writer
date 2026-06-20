const generationCore = require('../../ia/generation-core');
const factChecker = require('../../ia/fact-checking/fact-checker');
const { getStrategy, DEFAULT_TYPE, listTypes } = require('../../ia/strategies/strategy-registry');
const { extractSources, hasUnsourcedClaims } = require('../../ia/fact-checking/source-extractor');
const { buildHashtags } = require('../../ia/hashtag-service');
const rag = require('../../ia/rag/rag-service');
const db = require('../../config/database');

// L'user_id en base est un INTEGER. On coerce proprement (null si invalide).
function toUserId(value) {
    if (value === undefined || value === null || value === '') return null;
    const n = parseInt(value, 10);
    return Number.isInteger(n) ? n : null;
}

class PostController {
    /**
     * Liste les types de post disponibles (pour le sélecteur frontend)
     */
    async getTypes(req, res) {
        res.json({ success: true, data: listTypes() });
    }

    /**
     * Génère un nouveau post LinkedIn
     */
    async generatePost(req, res) {
        try {
            const { resume, objectif, ton, sujet, profile, comment } = req.body;
            const type = req.body.type || DEFAULT_TYPE;
            // user_id : priorité à l'utilisateur authentifié (req.user), sinon body.
            const userId = toUserId((req.user && req.user.id) || req.body.userId);

            // On accepte soit un profil structuré, soit un simple résumé texte.
            if ((!profile && !resume) || !objectif) {
                return res.status(400).json({
                    success: false,
                    error: 'Données manquantes : profil/résumé et objectif sont requis'
                });
            }

            const strategy = getStrategy(type);

            // Brief = fusion objectif + sujet (le profil porte le "qui parle").
            const brief = [objectif, sujet].filter(Boolean).join('. ');

            // 1) NOYAU : génère via l'entonnoir. userId => mémoire perso (personnalisation).
            const generation = await generationCore.generate({
                type,
                brief,
                profile: profile || resume,
                comment,
                userId,
            });
            const generatedPost = generation.post;

            // 2) FACT-CHECK obligatoire (analyse locale + web si claims factuelles).
            const factCheckResult = await factChecker.verifySafeToPublish(generatedPost);

            // 3) SOURCES réelles extraites du fact-check (URLs Google/Wikidata).
            const sources = extractSources(factCheckResult);
            const unsourced = hasUnsourcedClaims(factCheckResult);

            // 4) HASHTAGS pertinents (IA), cohérents avec le sujet, pour la portée.
            //    Non bloquant : si l'IA échoue, on continue sans hashtags.
            let hashtags = [];
            try {
                const hashtagResult = await buildHashtags(generatedPost, {
                    secteur: (profile && profile.sector) || undefined,
                });
                hashtags = hashtagResult.hashtags;
            } catch (htErr) {
                console.warn('⚠️  Hashtags non générés (non bloquant):', htErr.message);
            }

            // 5) Sauvegarde + transparence AI Act (is_ai_generated = true).
            const result = await db.query(
                `INSERT INTO generations_history
                (user_id, resume, objectif, ton, sujet, generated_post, fact_check_result, is_safe, post_type, is_ai_generated, sources, hashtags)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE, $10, $11)
                RETURNING id, created_at`,
                [
                    userId,
                    resume || (profile && profile.summary) || '',
                    objectif,
                    // 'ton' est legacy : la table n'accepte que professionnel|inspirant|engagé.
                    // Le vrai concept est maintenant 'post_type'. On garde une valeur valide.
                    ['professionnel', 'inspirant', 'engagé'].includes(ton) ? ton : 'professionnel',
                    sujet || null,
                    generatedPost,
                    JSON.stringify(factCheckResult),
                    factCheckResult.safe,
                    type,
                    JSON.stringify(sources),
                    JSON.stringify(hashtags),
                ]
            );

            // 5) APPRENTISSAGE : si le post est sûr et l'utilisateur identifié,
            // on le mémorise dans SON RAG pour personnaliser ses futurs posts.
            if (userId && factCheckResult.safe) {
                try {
                    await rag.rememberPost({
                        userId,
                        namespace: strategy.ragNamespace,
                        content: generatedPost,
                        metadata: { generationId: result.rows[0].id, type },
                    });
                } catch (memErr) {
                    // Non bloquant : la mémoire est un bonus, pas un point de défaillance.
                    console.warn('⚠️  Mémorisation RAG échouée (non bloquant):', memErr.message);
                }
            }

            res.json({
                success: true,
                data: {
                    id: result.rows[0].id,
                    post: generatedPost,
                    type,
                    isAiGenerated: true,         // transparence AI Act
                    sources,                     // sources réelles (URLs)
                    hashtags,                    // hashtags pertinents pour la portée
                    hasUnsourcedClaims: unsourced, // alerte : info factuelle sans source
                    bullshitViolations: generation.bullshitViolations,
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

            // Améliorer le post (nouveau noyau, voix conservée)
            const improvedPost = await generationCore.improve(originalPost, feedback);

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
