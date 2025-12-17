const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Analyze website accessibility
 * @param {string} url - Website URL to analyze
 * @returns {Object} Accessibility analysis results
 */
async function analyzeAccessibility(url) {
  try {
    console.log(`♿ Analyzing accessibility for: ${url}`);

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const issues = [];
    const recommendations = [];
    let score = 100;

    // Check for alt text on images
    const imagesWithoutAlt = $('img:not([alt])').length;
    const totalImages = $('img').length;
    if (imagesWithoutAlt > 0) {
      issues.push({ 
        type: 'error', 
        message: `${imagesWithoutAlt} of ${totalImages} images missing alt text`, 
        impact: 'high' 
      });
      score -= Math.min(imagesWithoutAlt * 3, 20);
    }

    // Check for proper heading structure
    const headings = $('h1, h2, h3, h4, h5, h6');
    let headingIssues = 0;
    
    // Check if H1 exists
    if ($('h1').length === 0) {
      issues.push({ type: 'error', message: 'Missing H1 heading', impact: 'high' });
      headingIssues++;
      score -= 15;
    }

    // Check for heading hierarchy
    let previousLevel = 0;
    headings.each((i, el) => {
      const level = parseInt(el.tagName.charAt(1));
      if (level > previousLevel + 1 && previousLevel !== 0) {
        headingIssues++;
      }
      previousLevel = level;
    });

    if (headingIssues > 1) {
      issues.push({ type: 'warning', message: 'Improper heading hierarchy', impact: 'medium' });
      score -= 10;
    }

    // Check for form labels
    const inputsWithoutLabels = $('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])').filter((i, el) => {
      const $input = $(el);
      const id = $input.attr('id');
      return !id || $(`label[for="${id}"]`).length === 0;
    }).length;

    if (inputsWithoutLabels > 0) {
      issues.push({ 
        type: 'error', 
        message: `${inputsWithoutLabels} form inputs missing labels`, 
        impact: 'high' 
      });
      score -= inputsWithoutLabels * 5;
    }

    // Check for color contrast (basic check for inline styles)
    const elementsWithInlineColors = $('[style*="color"]').length;
    if (elementsWithInlineColors > 0) {
      issues.push({ 
        type: 'warning', 
        message: 'Elements with inline colors detected - check contrast ratios', 
        impact: 'medium' 
      });
      score -= 5;
    }

    // Check for keyboard navigation support
    const focusableElements = $('a, button, input, select, textarea, [tabindex]').length;
    const elementsWithTabindex = $('[tabindex]').length;
    
    if (focusableElements > 0 && elementsWithTabindex === 0) {
      issues.push({ 
        type: 'info', 
        message: 'Consider adding proper tab navigation order', 
        impact: 'low' 
      });
      score -= 3;
    }

    // Check for ARIA landmarks
    const landmarks = $('[role="main"], [role="navigation"], [role="banner"], [role="contentinfo"], main, nav, header, footer').length;
    if (landmarks === 0) {
      issues.push({ 
        type: 'warning', 
        message: 'No ARIA landmarks or semantic HTML5 elements found', 
        impact: 'medium' 
      });
      score -= 8;
    }

    // Check for language attribute
    const htmlLang = $('html').attr('lang');
    if (!htmlLang) {
      issues.push({ type: 'warning', message: 'Missing language attribute on HTML element', impact: 'medium' });
      score -= 7;
    }

    // Check for skip links
    const skipLinks = $('a[href^="#"]').filter((i, el) => {
      const text = $(el).text().toLowerCase();
      return text.includes('skip') || text.includes('jump');
    }).length;

    if (skipLinks === 0) {
      issues.push({ type: 'info', message: 'No skip navigation links found', impact: 'low' });
      score -= 3;
    }

    // Generate recommendations
    if (imagesWithoutAlt > 0) {
      recommendations.push('Add descriptive alt text to all images');
    }
    if (inputsWithoutLabels > 0) {
      recommendations.push('Associate all form inputs with proper labels');
    }
    if (headingIssues > 0) {
      recommendations.push('Fix heading hierarchy (H1 → H2 → H3, etc.)');
    }
    recommendations.push('Test with screen readers and keyboard navigation');
    recommendations.push('Ensure sufficient color contrast (4.5:1 for normal text)');

    const accessibilityResults = {
      score: Math.max(score, 0),
      grade: getGrade(score),
      issues: issues,
      recommendations: recommendations,
      details: {
        totalImages: totalImages,
        imagesWithoutAlt: imagesWithoutAlt,
        headingCount: headings.length,
        inputsWithoutLabels: inputsWithoutLabels,
        hasLanguageAttribute: !!htmlLang,
        landmarkCount: landmarks,
        skipLinksCount: skipLinks
      }
    };

    console.log(`✅ Accessibility analysis completed - Score: ${accessibilityResults.score}`);
    return accessibilityResults;

  } catch (error) {
    console.error('Accessibility analysis error:', error);
    throw new Error(`Accessibility analysis failed: ${error.message}`);
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
  analyzeAccessibility
};