const express = require('express');
const router = express.Router();
const { analyzeSEO } = require('../services/seoService');
const { validateUrl } = require('../utils/validators');

// Analyze SEO for a website
router.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;

    if (!validateUrl(url)) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid website URL'
      });
    }

    console.log(`🔍 SEO Analysis for: ${url}`);

    const seoResults = await analyzeSEO(url);

    res.json({
      success: true,
      url: url,
      timestamp: new Date().toISOString(),
      seo: seoResults
    });

  } catch (error) {
    console.error('SEO analysis error:', error);
    res.status(500).json({
      error: 'SEO analysis failed',
      message: error.message
    });
  }
});

module.exports = router;