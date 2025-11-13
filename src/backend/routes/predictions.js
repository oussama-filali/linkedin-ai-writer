const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/prediction-controller');
const { body, validationResult } = require('express-validator');

/**
 * Middleware de validation des erreurs
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    next();
};

/**
 * @route   POST /api/predictions/analyze
 * @desc    Prédit les performances d'un post LinkedIn
 * @access  Public
 */
router.post(
    '/analyze',
    [
        body('content')
            .isString()
            .trim()
            .isLength({ min: 50, max: 3000 })
            .withMessage('Le contenu doit faire entre 50 et 3000 caractères'),
        body('context').optional().isObject()
    ],
    handleValidationErrors,
    predictionController.predictPerformance
);

/**
 * @route   POST /api/predictions/verify
 * @desc    Vérifie un contenu (fact-checking + filtre professionnel)
 * @access  Public
 */
router.post(
    '/verify',
    [
        body('content')
            .isString()
            .trim()
            .notEmpty()
            .withMessage('Le contenu est requis')
    ],
    handleValidationErrors,
    predictionController.verifyContent
);

/**
 * @route   POST /api/predictions/compare
 * @desc    Compare plusieurs variantes d'un post
 * @access  Public
 */
router.post(
    '/compare',
    [
        body('variants')
            .isArray({ min: 2 })
            .withMessage('Au moins 2 variantes requises'),
        body('variants.*')
            .isString()
            .trim()
            .isLength({ min: 50 })
            .withMessage('Chaque variante doit faire au moins 50 caractères'),
        body('context').optional().isObject()
    ],
    handleValidationErrors,
    predictionController.compareVariants
);

/**
 * @route   POST /api/predictions/timing
 * @desc    Analyse le meilleur timing de publication
 * @access  Public
 */
router.post(
    '/timing',
    [
        body('content')
            .isString()
            .trim()
            .notEmpty()
            .withMessage('Le contenu est requis'),
        body('audienceData').optional().isObject()
    ],
    handleValidationErrors,
    predictionController.analyzeTiming
);

module.exports = router;
