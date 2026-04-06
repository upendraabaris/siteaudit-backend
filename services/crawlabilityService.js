const axios = require('axios');

/**
 * Analyze crawlability: robots.txt and sitemap.xml
 * @param {string} url - Website URL to analyze
 * @returns {Object} Crawlability analysis results
 */
async function analyzeCrawlability(url) {
  try {
    console.log(`🤖 Analyzing crawlability for: ${url}`);

    const parsedUrl = new URL(url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;

    const [robotsResult, sitemapResult] = await Promise.all([
      checkRobotsTxt(baseUrl),
      checkSitemap(baseUrl)
    ]);

    const issues = [];
    const recommendations = [];
    let score = 100;

    // --- Robots.txt scoring ---
    if (!robotsResult.exists) {
      issues.push({ type: 'warning', message: 'No robots.txt file found', impact: 'medium' });
      recommendations.push('Create a robots.txt file to guide search engine crawlers');
      score -= 15;
    } else {
      // Check if important paths are blocked
      const blockedRoot = robotsResult.disallowedPaths.some(p => p === '/');
      if (blockedRoot) {
        issues.push({ type: 'error', message: 'robots.txt blocks the entire site (Disallow: /)', impact: 'high' });
        recommendations.push('Remove "Disallow: /" from robots.txt to allow search engines to crawl your site');
        score -= 25;
      }

      if (robotsResult.sitemapReferences.length === 0) {
        issues.push({ type: 'info', message: 'robots.txt does not reference a sitemap', impact: 'low' });
        recommendations.push('Add a Sitemap directive to your robots.txt (e.g., Sitemap: https://example.com/sitemap.xml)');
        score -= 5;
      }
    }

    // --- Sitemap scoring ---
    if (!sitemapResult.exists) {
      issues.push({ type: 'warning', message: 'No sitemap.xml file found', impact: 'medium' });
      recommendations.push('Create an XML sitemap to help search engines discover all your pages');
      score -= 15;
    } else {
      if (sitemapResult.urlCount === 0) {
        issues.push({ type: 'info', message: 'Sitemap exists but contains no URLs', impact: 'low' });
        score -= 5;
      }
    }

    return {
      score: Math.max(score, 0),
      robotsTxt: robotsResult,
      sitemap: sitemapResult,
      issues,
      recommendations
    };

  } catch (error) {
    console.error('Crawlability analysis error:', error);
    throw new Error(`Crawlability analysis failed: ${error.message}`);
  }
}

/**
 * Check robots.txt
 */
async function checkRobotsTxt(baseUrl) {
  const result = {
    exists: false,
    disallowedPaths: [],
    allowedPaths: [],
    sitemapReferences: [],
    rawContent: ''
  };

  try {
    const res = await axios.get(`${baseUrl}/robots.txt`, {
      timeout: 15000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (res.status === 200 && typeof res.data === 'string' && res.data.length > 0) {
      result.exists = true;
      result.rawContent = res.data.substring(0, 500);

      const lines = res.data.split('\n');
      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        if (trimmed.startsWith('disallow:')) {
          const path = line.split(':').slice(1).join(':').trim();
          if (path) result.disallowedPaths.push(path);
        } else if (trimmed.startsWith('allow:')) {
          const path = line.split(':').slice(1).join(':').trim();
          if (path) result.allowedPaths.push(path);
        } else if (trimmed.startsWith('sitemap:')) {
          const sitemapUrl = line.split('sitemap:')[1]?.trim() || line.split('Sitemap:')[1]?.trim();
          if (sitemapUrl) result.sitemapReferences.push(sitemapUrl);
        }
      }
    }
  } catch (e) {
    // robots.txt not accessible
  }

  return result;
}

/**
 * Check sitemap.xml
 */
async function checkSitemap(baseUrl) {
  const result = {
    exists: false,
    urlCount: 0,
    type: 'unknown'
  };

  try {
    const res = await axios.get(`${baseUrl}/sitemap.xml`, {
      timeout: 15000,
      validateStatus: () => true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (res.status === 200 && typeof res.data === 'string' && res.data.includes('<')) {
      result.exists = true;

      // Count <url> entries (standard sitemap)
      const urlMatches = res.data.match(/<url>/gi);
      if (urlMatches) {
        result.urlCount = urlMatches.length;
        result.type = 'xml';
      }

      // Check for sitemap index
      const sitemapIndexMatches = res.data.match(/<sitemap>/gi);
      if (sitemapIndexMatches) {
        result.urlCount = sitemapIndexMatches.length;
        result.type = 'index';
      }
    }
  } catch (e) {
    // sitemap.xml not accessible
  }

  return result;
}

module.exports = { analyzeCrawlability };
