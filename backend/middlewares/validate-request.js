const { body, validationResult } = require('express-validator');

/**
 * Middleware de validation générique
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

/**
 * Validation pour la génération de post
 */
const generatePost = [
    body('resume')
        .trim()
        .notEmpty().withMessage('Le résumé est requis')
        .isLength({ min: 50, max: 5000 }).withMessage('Le résumé doit contenir entre 50 et 5000 caractères'),
    body('objectif')
        .trim()
        .notEmpty().withMessage('L\'objectif est requis')
        .isLength({ max: 500 }).withMessage('L\'objectif ne peut dépasser 500 caractères'),
    body('ton')
        .trim()
        .notEmpty().withMessage('Le ton est requis')
        .isIn(['professionnel', 'inspirant', 'engagé']).withMessage('Ton invalide'),
    body('sujet')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Le sujet ne peut dépasser 500 caractères'),
    validate
];

/**
 * Validation pour l'amélioration de post
 */
const improvePost = [
    body('postId')
        .notEmpty().withMessage('L\'ID du post est requis')
        .isInt({ min: 1 }).withMessage('ID de post invalide'),
    body('feedback')
        .trim()
        .notEmpty().withMessage('Le feedback est requis')
        .isLength({ min: 10, max: 1000 }).withMessage('Le feedback doit contenir entre 10 et 1000 caractères'),
    validate
];

/**
 * Validation pour le fact-checking
 */
const checkContent = [
    body('content')
        .trim()
        .notEmpty().withMessage('Le contenu est requis')
        .isLength({ min: 10, max: 10000 }).withMessage('Le contenu doit contenir entre 10 et 10000 caractères'),
    validate
];

module.exports = {
    generatePost,
    improvePost,
    checkContent
};
