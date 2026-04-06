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

    // --- Keyword Density Analysis ---
    // Remove non-visible elements
    $('script, style, noscript, iframe, svg').remove();
    const bodyText = $('body').text() || '';
    
    // Tokenize: keep all words for phrase building
    const stopWords = new Set([
      'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one',
      'our', 'out', 'has', 'have', 'from', 'been', 'will', 'with', 'they', 'this', 'that', 'what',
      'when', 'make', 'like', 'just', 'over', 'such', 'take', 'than', 'them', 'very', 'some',
      'your', 'into', 'most', 'also', 'more', 'other', 'which', 'their', 'about', 'would',
      'these', 'there', 'could', 'does', 'each', 'here', 'those', 'where', 'being', 'using',
      'only', 'then', 'first', 'come', 'made', 'find', 'back', 'many', 'way', 'may', 'how',
      'get', 'see', 'use', 'new', 'now', 'any', 'own', 'its', 'say', 'said', 'should'
    ]);

    // All cleaned words (including stopwords, for phrase building)
    const rawWords = bodyText
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2);

    // Single words (filtered, no stopwords)
    const singleWords = rawWords.filter(w => w.length >= 3 && !stopWords.has(w));
    const totalWords = singleWords.length;

    // Count single word frequency
    const singleFreq = {};
    for (const word of singleWords) {
      singleFreq[word] = (singleFreq[word] || 0) + 1;
    }

    const topSingleKeywords = Object.entries(singleFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({
        word,
        count,
        density: totalWords > 0 ? parseFloat(((count / totalWords) * 100).toFixed(2)) : 0
      }));

    // Build n-gram phrases from raw words (with quality filtering)
    const buildNgrams = (words, n) => {
      const freq = {};
      for (let i = 0; i <= words.length - n; i++) {
        const phraseWords = words.slice(i, i + n);
        const phrase = phraseWords.join(' ');

        // Quality filters for accurate phrases:
        // 1. First word must NOT be a stopword (no "the seo", "and website")
        if (stopWords.has(phraseWords[0]) || phraseWords[0].length < 3) continue;
        // 2. Last word must NOT be a stopword (no "seo the", "audit and")
        if (stopWords.has(phraseWords[n - 1]) || phraseWords[n - 1].length < 3) continue;
        // 3. At least half of the words must be meaningful
        const meaningfulCount = phraseWords.filter(w => w.length >= 3 && !stopWords.has(w)).length;
        if (meaningfulCount < Math.ceil(n / 2)) continue;
        // 4. Skip if phrase contains numbers
        if (/\d/.test(phrase)) continue;

        freq[phrase] = (freq[phrase] || 0) + 1;
      }
      // Only return phrases that appear 2+ times
      return Object.entries(freq)
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([phrase, count]) => ({
          word: phrase,
          count,
          density: totalWords > 0 ? parseFloat(((count / totalWords) * 100).toFixed(2)) : 0
        }));
    };

    const topBigrams = buildNgrams(rawWords, 2);
    const topTrigrams = buildNgrams(rawWords, 3);

    const uniqueWords = Object.keys(singleFreq).length;

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
        schemaTypes: [...new Set(schemaTypes)],
        keywords: {
          totalWords,
          uniqueWords,
          topKeywords: topSingleKeywords,
          topBigrams,
          topTrigrams
        }
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