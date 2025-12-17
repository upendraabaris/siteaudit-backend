const express = require('express');
const router = express.Router();
const { analyzePerformance } = require('../services/performanceService');
const { validateUrl } = require('../utils/validators');

// Analyze website performance
router.post('/analyze', async (req, res) => {
  try {
    const { url } = req.body;

    if (!validateUrl(url)) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid website URL'
      });
    }

    console.log(`⚡ Performance Analysis for: ${url}`);

    const performanceResults = await analyzePerformance(url);

    
    res.json({
      success: true,
      url: url,
      timestamp: new Date().toISOString(),
      performance: performanceResults
    });

  } catch (error) {
    console.error('Performance analysis error:', error);
    res.status(500).json({
      error: 'Performance analysis failed',
      message: error.message
    });
  }
});

module.exports = router;