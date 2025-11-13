const express = require('express');
const router = express.Router();
const postController = require('../controllers/post-controller');
const validateRequest = require('../middlewares/validate-request');

/**
 * @route   POST /api/posts/generate
 * @desc    Génère un nouveau post LinkedIn
 * @access  Public (ajouter auth middleware plus tard)
 */
router.post('/generate', validateRequest.generatePost, postController.generatePost);

/**
 * @route   POST /api/posts/improve
 * @desc    Améliore un post existant
 * @access  Public
 */
router.post('/improve', validateRequest.improvePost, postController.improvePost);

/**
 * @route   GET /api/posts/history
 * @desc    Récupère l'historique des posts
 * @access  Public
 */
router.get('/history', postController.getHistory);

/**
 * @route   POST /api/posts/check
 * @desc    Vérifie le fact-checking d'un contenu
 * @access  Public
 */
router.post('/check', validateRequest.checkContent, postController.checkContent);

module.exports = router;
