const { analyzeSEO } = require('./seoService');
const { analyzePerformance } = require('./performanceService');
const { analyzeAccessibility } = require('./accessibilityService');
const { analyzeBestPractices } = require('./bestPracticesService');

/**
 * Run complete website audit
 * @param {string} url - Website URL to audit
 * @returns {Object} Complete audit results
 */
async function runFullAudit(url) {
  try {
    console.log(`🚀 Starting full audit for: ${url}`);

    // Run all audits in parallel for better performance
    const [seoResults, performanceResults, accessibilityResults, bestPracticesResults] = await Promise.all([
      analyzeSEO(url).catch(err => ({ error: err.message, score: 0 })),
      analyzePerformance(url).catch(err => ({ error: err.message, score: 0 })),
      analyzeAccessibility(url).catch(err => ({ error: err.message, score: 0 })),
      analyzeBestPractices(url).catch(err => ({ error: err.message, score: 0 }))
    ]);

    // Calculate overall score
    const scores = [
      seoResults.score || 0,
      performanceResults.score || 0,
      accessibilityResults.score || 0,
      bestPracticesResults.score || 0
    ];
    
    const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    const auditResults = {
      overall: {
        score: overallScore,
        grade: getGrade(overallScore),
        timestamp: new Date().toISOString()
      },
      seo: seoResults,
      performance: performanceResults,
      accessibility: accessibilityResults,
      bestPractices: bestPracticesResults,
      summary: {
        totalIssues: (seoResults.issues?.length || 0) + 
                   (performanceResults.issues?.length || 0) + 
                   (accessibilityResults.issues?.length || 0) + 
                   (bestPracticesResults.issues?.length || 0),
        criticalIssues: 0, // Will be calculated based on issue severity
        recommendations: []
      }
    };

    console.log(`✅ Audit completed for: ${url} - Score: ${overallScore}`);
    return auditResults;

  } catch (error) {
    console.error('Full audit error:', error);
    throw new Error(`Audit failed: ${error.message}`);
  }
}

/**
 * Get grade based on score
 * @param {number} score - Audit score (0-100)
 * @returns {string} Grade letter
 */
function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

module.exports = {
  runFullAudit,
  getGrade
};