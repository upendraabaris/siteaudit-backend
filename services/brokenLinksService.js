const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Analyze broken links and images for a website
 * @param {string} url - Website URL to analyze
 * @returns {Object} Broken link analysis results
 */
async function analyzeBrokenLinks(url) {
  try {
    console.log(`🔗 Checking for broken links and images: ${url}`);

    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const resourcesMap = new Map();

    // Helper to clean and add resource
    const addResource = (href, text, type) => {
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

      try {
        const absoluteUrl = new URL(href, url);
        absoluteUrl.hash = ''; // Strip fragment/hash
        const cleanUrl = absoluteUrl.href;

        if (!resourcesMap.has(cleanUrl)) {
          resourcesMap.set(cleanUrl, { url: cleanUrl, text, type });
        }
      } catch (e) { }
    };

    $('a[href]').each((_, el) => addResource($(el).attr('href'), $(el).text().trim() || 'Link', 'link'));
    $('img[src]').each((_, el) => addResource($(el).attr('src'), $(el).attr('alt') || 'Image', 'image'));

    const uniqueResources = Array.from(resourcesMap.values()).slice(0, 50); // Limit to 50 for performance

    console.log(`Checking ${uniqueResources.length} unique resources...`);

    const concurrencyLimit = 5;
    const results = [];

    for (let i = 0; i < uniqueResources.length; i += concurrencyLimit) {
      const batch = uniqueResources.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(batch.map(res => checkResource(res)));
      results.push(...batchResults);
    }

    const broken = results.filter(r => !r.ok);
    const validCount = results.length - broken.length;

    let score = 100;
    if (results.length > 0) {
      score = Math.max(0, 100 - (broken.length * 2));
    }

    return {
      score: Math.round(score),
      totalChecked: results.length,
      brokenCount: broken.length,
      validCount: validCount,
      brokenItems: broken
    };

  } catch (error) {
    console.error('Broken Links analysis error:', error);
    throw new Error(`Broken Links analysis failed: ${error.message}`);
  }
}

async function checkResource(resource) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  };

  try {
    // Try HEAD first
    const res = await axios.head(resource.url, { timeout: 15000, headers, validateStatus: () => true });

    // Fallback to GET if HEAD failed or returned 405/403 (some servers block HEAD)
    if (res.status >= 400 && res.status !== 404) {
      const getRes = await axios.get(resource.url, { timeout: 15000, headers, validateStatus: () => true });
      return processStatus(resource, getRes.status);
    }

    return processStatus(resource, res.status);
  } catch (error) {
    return processStatus(resource, error.response?.status || 0, error.code || error.message);
  }
}

function processStatus(resource, status, errorMsg) {
  const isSocial = /facebook\.com|linkedin\.com|twitter\.com|instagram\.com/.test(resource.url);

  // Facebook/LinkedIn often return 403/999/400 to bots
  if (isSocial && (status === 403 || status === 999 || status === 401 || status === 400 || status === 405)) {
    return { ...resource, ok: true, status, note: 'Social media bot protection (likely valid)' };
  }

  const ok = status > 0 && status < 400;
  return {
    ...resource,
    ok,
    status: status || null,
    error: ok ? null : (errorMsg || `Status ${status}`),
    note: status === 404 ? 'Page not found' : null
  };
}

module.exports = { analyzeBrokenLinks };
