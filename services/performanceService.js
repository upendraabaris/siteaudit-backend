const axios = require('axios');

/**
 * Analyze website performance
 * @param {string} url - Website URL to analyze
 * @returns {Object} Performance analysis results
 */
async function analyzePerformance(url) {
  try {
    console.log(`⚡ Analyzing performance for: ${url}`);

    const startTime = Date.now();
    
    // Basic performance metrics
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const loadTime = Date.now() - startTime;
    const contentSize = Buffer.byteLength(response.data, 'utf8');
    
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Analyze load time
    if (loadTime > 3000) {
      issues.push({ type: 'error', message: `Slow page load time: ${loadTime}ms`, impact: 'high' });
      score -= 20;
    } else if (loadTime > 1500) {
      issues.push({ type: 'warning', message: `Moderate page load time: ${loadTime}ms`, impact: 'medium' });
      score -= 10;
    }

    // Analyze content size
    const sizeInKB = Math.round(contentSize / 1024);
    if (sizeInKB > 1000) {
      issues.push({ type: 'warning', message: `Large page size: ${sizeInKB}KB`, impact: 'medium' });
      score -= 15;
    }

    // Check response headers for optimization
    const headers = response.headers;
    
    // Check for compression
    if (!headers['content-encoding']) {
      issues.push({ type: 'warning', message: 'No compression detected', impact: 'medium' });
      score -= 10;
    }

    // Check for caching headers
    if (!headers['cache-control'] && !headers['expires']) {
      issues.push({ type: 'warning', message: 'No caching headers found', impact: 'medium' });
      score -= 8;
    }

    // Check for CDN (basic check)
    const server = headers['server'] || '';
    const cdnHeaders = ['cloudflare', 'cloudfront', 'fastly', 'maxcdn'];
    const hasCDN = cdnHeaders.some(cdn => server.toLowerCase().includes(cdn));
    
    if (!hasCDN) {
      issues.push({ type: 'info', message: 'Consider using a CDN for better performance', impact: 'low' });
      score -= 5;
    }

    // Generate recommendations
    if (loadTime > 1500) {
      recommendations.push('Optimize images and reduce file sizes');
      recommendations.push('Enable compression (gzip/brotli)');
      recommendations.push('Minimize HTTP requests');
    }
    
    if (sizeInKB > 500) {
      recommendations.push('Reduce page size by optimizing assets');
    }

    // Calculate Core Web Vitals estimates (simplified)
    const coreWebVitals = {
      lcp: loadTime < 2500 ? 'good' : loadTime < 4000 ? 'needs-improvement' : 'poor',
      fid: 'good', // Simplified - would need real user data
      cls: 'good'  // Simplified - would need layout shift measurement
    };

    const performanceResults = {
      score: Math.max(score, 0),
      grade: getGrade(score),
      issues: issues,
      recommendations: recommendations,
      metrics: {
        loadTime: loadTime,
        pageSize: sizeInKB,
        hasCompression: !!headers['content-encoding'],
        hasCaching: !!(headers['cache-control'] || headers['expires']),
        hasCDN: hasCDN,
        responseTime: loadTime
      },
      coreWebVitals: coreWebVitals
    };

    console.log(`✅ Performance analysis completed - Score: ${performanceResults.score}`);
    return performanceResults;

  } catch (error) {
    console.error('Performance analysis error:', error);
    throw new Error(`Performance analysis failed: ${error.message}`);
  }
}

function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

module.exports = {
  analyzePerformance
};