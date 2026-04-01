const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Analyze SEO factors of a website
 * @param {string} url - Website URL to analyze
 * @returns {Object} SEO analysis results
 */
async function analyzeSEO(url) {
  try {
    console.log(`🔍 Analyzing SEO for: ${url}`);

    // Fetch the webpage
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Check title tag
    const title = $('title').text().trim();
    if (!title) {
      issues.push({ type: 'error', message: 'Missing title tag', impact: 'high' });
      score -= 15;
    } else if (title.length < 30 || title.length > 60) {
      issues.push({ type: 'warning', message: `Title length should be 30-60 characters (current: ${title.length})`, impact: 'medium' });
      score -= 10;
    }

    // Check meta description
    const metaDescription = $('meta[name="description"]').attr('content');
    if (!metaDescription) {
      issues.push({ type: 'error', message: 'Missing meta description', impact: 'high' });
      score -= 15;
    } else if (metaDescription.length < 120 || metaDescription.length > 160) {
      issues.push({ type: 'warning', message: `Meta description should be 120-160 characters (current: ${metaDescription.length})`, impact: 'medium' });
      score -= 8;
    }

    // Check H1 tags
    const h1Tags = $('h1');
    if (h1Tags.length === 0) {
      issues.push({ type: 'error', message: 'Missing H1 tag', impact: 'high' });
      score -= 12;
    } else if (h1Tags.length > 1) {
      issues.push({ type: 'warning', message: 'Multiple H1 tags found', impact: 'medium' });
      score -= 8;
    }

    // Check images without alt text
    const imagesWithoutAlt = $('img:not([alt])').length;
    if (imagesWithoutAlt > 0) {
      issues.push({ type: 'warning', message: `${imagesWithoutAlt} images missing alt text`, impact: 'medium' });
      score -= Math.min(imagesWithoutAlt * 2, 15);
    }

    // Check for canonical URL
    const canonical = $('link[rel="canonical"]').attr('href');
    if (!canonical) {
      issues.push({ type: 'warning', message: 'Missing canonical URL', impact: 'low' });
      score -= 5;
    }

    // Check for Open Graph tags
    const ogTitle = $('meta[property="og:title"]').attr('content');
    const ogDescription = $('meta[property="og:description"]').attr('content');
    const ogImage = $('meta[property="og:image"]').attr('content');
    const ogSiteName = $('meta[property="og:site_name"]').attr('content');
    const ogType = $('meta[property="og:type"]').attr('content');

    // Check for Twitter tags
    const twitterCard = $('meta[name="twitter:card"]').attr('content');
    const twitterTitle = $('meta[name="twitter:title"]').attr('content') || ogTitle;
    const twitterDescription = $('meta[name="twitter:description"]').attr('content') || ogDescription;
    const twitterImage = $('meta[name="twitter:image"]').attr('content') || ogImage;
    const twitterSite = $('meta[name="twitter:site"]').attr('content');

    if (!ogTitle || !ogDescription) {
      issues.push({ type: 'info', message: 'Missing Open Graph tags for social sharing', impact: 'low' });
      score -= 3;
    }

    // Check for JSON-LD Schema
    const schemaTypes = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html());
        const getTypes = (obj) => {
          if (!obj) return;
          if (obj['@type']) schemaTypes.push(obj['@type']);
          if (obj['@graph'] && Array.isArray(obj['@graph'])) {
            obj['@graph'].forEach(item => getTypes(item));
          }
        };
        getTypes(json);
      } catch (e) {
        // Skip invalid JSON
      }
    });

    if (schemaTypes.length === 0) {
      issues.push({ type: 'info', message: 'No structured data (Schema.org) detected', impact: 'low' });
      score -= 2;
    }

    // Generate recommendations
    if (issues.length > 0) {
      recommendations.push('Fix critical SEO issues first (missing title, meta description, H1)');
      recommendations.push('Optimize title and meta description lengths');
      recommendations.push('Add alt text to all images');
    }

    const seoResults = {
      score: Math.max(score, 0),
      grade: getGrade(score),
      issues: issues,
      recommendations: recommendations,
      details: {
        title: title || 'Not found',
        titleLength: title ? title.length : 0,
        metaDescription: metaDescription || 'Not found',
        metaDescriptionLength: metaDescription ? metaDescription.length : 0,
        h1Count: h1Tags.length,
        imagesWithoutAlt: imagesWithoutAlt,
        hasCanonical: !!canonical,
        hasOpenGraph: !!(ogTitle && ogDescription),
        social: {
          ogTitle,
          ogDescription,
          ogImage,
          ogSiteName,
          ogType,
          twitterCard,
          twitterTitle,
          twitterDescription,
          twitterImage,
          twitterSite
        },
        schemaTypes: [...new Set(schemaTypes)] // Unique types
      }
    };

    console.log(`✅ SEO analysis completed - Score: ${seoResults.score}`);
    return seoResults;

  } catch (error) {
    console.error('SEO analysis error:', error);
    throw new Error(`SEO analysis failed: ${error.message}`);
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
  analyzeSEO
};