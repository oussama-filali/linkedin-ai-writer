const express = require('express');
const axios = require('axios');
const router = express.Router();

// Debug endpoint to test Google Fact Check Tools API via server-side key
router.get('/factcheck', async (req, res) => {
  const query = req.query.q || req.query.query || 'France';
  const key = process.env.GOOGLE_FACT_CHECK_API_KEY;

  const result = {
    keyPresent: Boolean(key),
    query,
    requestUrl: 'https://factchecktools.googleapis.com/v1alpha1/claims:search',
  };

  if (!key) {
    return res.status(400).json({
      success: false,
      error: 'GOOGLE_FACT_CHECK_API_KEY manquante dans .env',
      details: result,
    });
  }

  try {
    const response = await axios.get('https://factchecktools.googleapis.com/v1alpha1/claims:search', {
      params: {
        key,
        query,
        languageCode: 'fr',
        pageSize: 1,
      },
      headers: {
        'X-Goog-Api-Key': key,
        // Ces en-têtes aident si la clé est restreinte par referrer/origin côté Google
        'Referer': 'http://localhost',
        'Origin': 'http://localhost',
      },
      timeout: 8000,
      validateStatus: () => true, // nous renvoyons l'erreur brute pour debug
    });

    return res.status(response.status).json({
      success: response.status === 200,
      status: response.status,
      data: response.data,
      headers: response.headers,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }
});

module.exports = router;
