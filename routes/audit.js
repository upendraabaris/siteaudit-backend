const express = require('express');
const router = express.Router();
const { runFullAudit } = require('../services/auditService');
const { validateUrl } = require('../utils/validators');

// Run complete website audit
router.post('/run', async (req, res) => {
  try {
    const { url } = req.body;

    // Validate URL
    if (!validateUrl(url)) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Please provide a valid website URL'
      });
    }

    console.log(`🔍 Starting audit for: ${url}`);

    // Run complete audit
    const auditResults = await runFullAudit(url);

    res.json({
      success: true,
      url: url,
      timestamp: new Date().toISOString(),
      results: auditResults
    });

  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({
      error: 'Audit failed',
      message: error.message
    });
  }
});

// Get audit status (for future use)
router.get('/status/:id', (req, res) => {
  res.json({
    id: req.params.id,
    status: 'completed',
    message: 'Audit completed successfully'
  });
});

module.exports = router;