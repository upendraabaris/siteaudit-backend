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

// Run competitor comparison audit
router.post('/compare', async (req, res) => {
  try {
    const { url1, url2 } = req.body;

    if (!validateUrl(url1) || !validateUrl(url2)) {
      return res.status(400).json({
        error: 'Invalid URLs',
        message: 'Please provide two valid website URLs'
      });
    }

    console.log(`⚔️ Starting comparison: ${url1} vs ${url2}`);

    // Run audits sequentially for better reliability and lower peak load
    console.log(`Audit 1 starting: ${url1}`);
    const audit1 = await runFullAudit(url1);
    console.log(`Audit 1 finished. Starting audit 2: ${url2}`);
    const audit2 = await runFullAudit(url2);
    console.log('Battle analysis complete.');

    // Calculate match relevance (No AI needed)
    const relevance = calculateRelevance(audit1, audit2);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        site1: { url: url1, ...audit1 },
        site2: { url: url2, ...audit2 },
        comparison: {
          relevanceScore: relevance.score,
          commonKeywords: relevance.commonKeywords,
          matchLevel: relevance.matchLevel
        }
      }
    });

  } catch (error) {
    console.error('Comparison error:', error);
    res.status(500).json({
      error: 'Comparison failed',
      message: error.message
    });
  }
});

/**
 * Calculate similarity between two sites based on keywords
 */
function calculateRelevance(audit1, audit2) {
  const getKeywords = (audit) => {
    const text = `${audit.seo.details.title} ${audit.seo.details.metaDescription}`.toLowerCase();
    const words = text.match(/\b(\w{4,})\b/g) || []; // Only words with 4+ characters
    const stopWords = ['this', 'that', 'with', 'from', 'your', 'their', 'about', 'more', 'have', 'will'];
    return [...new Set(words.filter(w => !stopWords.includes(w)))];
  };

  const kw1 = getKeywords(audit1);
  const kw2 = getKeywords(audit2);
  
  const common = kw1.filter(w => kw2.includes(w));
  const score = Math.min(Math.round((common.length / 5) * 100), 100);
  
  let matchLevel = 'Low';
  if (score > 80) matchLevel = 'High';
  else if (score > 40) matchLevel = 'Medium';

  return {
    score,
    commonKeywords: common.slice(0, 5),
    matchLevel
  };
}

// Get audit status (for future use)
router.get('/status/:id', (req, res) => {
  res.json({
    id: req.params.id,
    status: 'completed',
    message: 'Audit completed successfully'
  });
});

module.exports = router;