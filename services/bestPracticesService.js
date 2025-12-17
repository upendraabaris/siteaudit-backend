const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Analyze website best practices
 * @param {string} url - Website URL to analyze
 * @returns {Object} Best practices analysis results
 */
async function analyzeBestPractices(url) {
  try {
    console.log(`✅ Analyzing best practices for: ${url}`);

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const headers = response.headers;
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Check for HTTPS
    const isHTTPS = url.startsWith('https://');
    if (!isHTTPS) {
      issues.push({ type: 'error', message: 'Website not using HTTPS', impact: 'high' });
      score -= 20;
    }

    // Check for security headers
    const securityHeaders = {
      'x-content-type-options': 'Missing X-Content-Type-Options header',
      'x-frame-options': 'Missing X-Frame-Options header',
      'x-xss-protection': 'Missing X-XSS-Protection header',
      'strict-transport-security': 'Missing Strict-Transport-Security header'
    };

    Object.keys(securityHeaders).forEach(header => {
      if (!headers[header]) {
        issues.push({ 
          type: 'warning', 
          message: securityHeaders[header], 
          impact: 'medium' 
        });
        score -= 5;
      }
    });

    // Check for viewport meta tag
    const viewportMeta = $('meta[name="viewport"]').attr('content');
    if (!viewportMeta) {
      issues.push({ type: 'error', message: 'Missing viewport meta tag', impact: 'high' });
      score -= 15;
    } else if (!viewportMeta.includes('width=device-width')) {
      issues.push({ type: 'warning', message: 'Viewport meta tag should include width=device-width', impact: 'medium' });
      score -= 8;
    }

    // Check for favicon
    const favicon = $('link[rel*="icon"]').length > 0 || $('link[rel="shortcut icon"]').length > 0;
    if (!favicon) {
      issues.push({ type: 'info', message: 'No favicon found', impact: 'low' });
      score -= 3;
    }

    // Check for external links security
    const externalLinks = $('a[href^="http"]:not([href*="' + new URL(url).hostname + '"])');
    const unsafeExternalLinks = externalLinks.filter((i, el) => {
      const rel = $(el).attr('rel') || '';
      return !rel.includes('noopener') || !rel.includes('noreferrer');
    }).length;

    if (unsafeExternalLinks > 0) {
      issues.push({ 
        type: 'warning', 
        message: `${unsafeExternalLinks} external links missing rel="noopener noreferrer"`, 
        impact: 'medium' 
      });
      score -= Math.min(unsafeExternalLinks * 2, 10);
    }

    // Check for mixed content (HTTP resources on HTTPS page)
    if (isHTTPS) {
      const httpResources = $('img[src^="http:"], script[src^="http:"], link[href^="http:"]').length;
      if (httpResources > 0) {
        issues.push({ 
          type: 'error', 
          message: `${httpResources} HTTP resources on HTTPS page (mixed content)`, 
          impact: 'high' 
        });
        score -= 15;
      }
    }

    // Check for deprecated HTML elements
    const deprecatedElements = $('center, font, marquee, blink').length;
    if (deprecatedElements > 0) {
      issues.push({ 
        type: 'warning', 
        message: `${deprecatedElements} deprecated HTML elements found`, 
        impact: 'low' 
      });
      score -= deprecatedElements * 2;
    }

    // Check for inline styles and scripts
    const inlineStyles = $('[style]').length;
    const inlineScripts = $('script:not([src])').length;
    
    if (inlineStyles > 5) {
      issues.push({ 
        type: 'info', 
        message: `Many inline styles found (${inlineStyles}) - consider using external CSS`, 
        impact: 'low' 
      });
      score -= 3;
    }

    if (inlineScripts > 2) {
      issues.push({ 
        type: 'info', 
        message: `Multiple inline scripts found (${inlineScripts}) - consider using external JS`, 
        impact: 'low' 
      });
      score -= 3;
    }

    // Check for console errors (would need browser automation for real check)
    // This is a placeholder for future implementation

    // Generate recommendations
    if (!isHTTPS) {
      recommendations.push('Implement HTTPS with valid SSL certificate');
    }
    if (Object.keys(securityHeaders).some(h => !headers[h])) {
      recommendations.push('Add security headers for better protection');
    }
    if (!viewportMeta) {
      recommendations.push('Add viewport meta tag for mobile responsiveness');
    }
    if (unsafeExternalLinks > 0) {
      recommendations.push('Add rel="noopener noreferrer" to external links');
    }

    const bestPracticesResults = {
      score: Math.max(score, 0),
      grade: getGrade(score),
      issues: issues,
      recommendations: recommendations,
      details: {
        isHTTPS: isHTTPS,
        hasViewport: !!viewportMeta,
        hasFavicon: favicon,
        securityHeaders: {
          contentTypeOptions: !!headers['x-content-type-options'],
          frameOptions: !!headers['x-frame-options'],
          xssProtection: !!headers['x-xss-protection'],
          hsts: !!headers['strict-transport-security']
        },
        externalLinksCount: externalLinks.length,
        unsafeExternalLinks: unsafeExternalLinks,
        deprecatedElements: deprecatedElements,
        inlineStyles: inlineStyles,
        inlineScripts: inlineScripts
      }
    };

    console.log(`✅ Best practices analysis completed - Score: ${bestPracticesResults.score}`);
    return bestPracticesResults;

  } catch (error) {
    console.error('Best practices analysis error:', error);
    throw new Error(`Best practices analysis failed: ${error.message}`);
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
  analyzeBestPractices
};