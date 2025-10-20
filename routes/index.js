const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/', (req, res) => {
    res.render('index'); // Affiche la page d'accueil
});

router.post('/generate', async (req, res) => {
    try {
        const prompt = req.body.prompt;
        const response = await axios.post('http://127.0.0.1:5000/generate', { prompt });
        res.render('result', { post: response.data.response });
    } catch (error) {
        console.error("Erreur lors de l'appel au service Hugging Face :", error.message);
        res.status(500).send("Une erreur est survenue lors de la génération de la réponse.");
    }
});

module.exports = router;
