import express from 'express';
import {
  searchProducts,
  searchProductsByName,
  searchProductsByCategory,
  getSearchStats,
  searchHealthCheck,
  getTrendingKeywords,
  getKeywordSuggestions,
  getKeywordAnalytics
} from '../controllers/searchController.js';
import { verifyFirebaseToken } from '../middleware/verifyFirebaseToken.js';
import translationService from '../services/translationService.js';

const router = express.Router();

// Translation endpoint using LibreTranslate service
router.post('/translate', async (req, res) => {
  try {
    const { query, language = 'auto' } = req.body;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query is required and must be a non-empty string',
        error: 'INVALID_QUERY'
      });
    }

    console.log('🔍 Translation request received:', {
      query: query.trim(),
      language: language,
      timestamp: new Date().toISOString()
    });

    // Process text through translation service
    const result = await translationService.processText(query.trim());

    if (!result.success) {
      console.error('❌ Translation processing failed:', result.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process translation',
        error: 'TRANSLATION_FAILED',
        details: result.error
      });
    }

    console.log('✅ Translation completed:', {
      originalText: result.originalText,
      processedText: result.processedText,
      detectedLanguage: result.detectedLanguage,
      wasTranslated: result.wasTranslated
    });

    return res.json({
      success: true,
      data: {
        originalText: result.originalText,
        processedText: result.processedText,
        detectedLanguage: result.detectedLanguage,
        confidence: result.confidence,
        wasTranslated: result.wasTranslated,
        fallback: result.fallback || false
      }
    });

  } catch (error) {
    console.error('❌ Translation endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Translation service error',
      error: error.message
    });
  }
});

// Legacy translation endpoint (no auth required for testing)
router.post('/translate-legacy', async (req, res) => {
  try {
    const { text, source = 'hi', target = 'en' } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log(`🔄 Backend translating: "${text}" from ${source} to ${target}`);

    // Try multiple LibreTranslate endpoints
    const endpoints = [
      'https://libretranslate.de/translate',
      'https://translate.argosopentech.com/translate',
      'https://libretranslate.com/translate'
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Trying endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: source,
            target: target,
            format: 'text'
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Endpoint ${endpoint} failed:`, response.status, errorText);
          lastError = new Error(`Translation failed: ${response.status} - ${errorText}`);
          continue;
        }

        const data = await response.json();
        if (!data.translatedText) {
          console.error(`❌ Invalid response from ${endpoint}:`, data);
          lastError = new Error('Invalid response: translatedText field not found');
          continue;
        }

        console.log('✅ Translation result:', data.translatedText);
        return res.json({ 
          success: true, 
          translatedText: data.translatedText,
          originalText: text,
          source,
          target,
          endpoint
        });

      } catch (error) {
        console.error(`❌ Error with endpoint ${endpoint}:`, error);
        lastError = error;
        continue;
      }
    }

    // If all endpoints failed, try fallback translation
    const fallbackTranslations = {
      'चावल': 'rice',
      'दाल': 'lentils',
      'रोटी': 'bread',
      'भात': 'rice',
      'पोळी': 'bread',
      'लैपटॉप': 'laptop',
      'कंप्यूटर': 'computer',
      'मोबाइल': 'mobile',
      'फोन': 'phone',
      'खोजें': 'find',
      'शोधा': 'search',
      'इलेक्ट्रॉनिक्स': 'electronics',
      'सब्जी': 'vegetables',
      'फल': 'fruits',
      'दूध': 'milk',
      'अंडे': 'eggs',
      'मांस': 'meat',
      'मछली': 'fish',
      'चिकन': 'chicken',
      'आलू': 'potato',
      'टमाटर': 'tomato',
      'प्याज': 'onion',
      'गाजर': 'carrot',
      'बैंगन': 'brinjal',
      'शिमला मिर्च': 'capsicum',
      'मिर्च': 'chili',
      'हल्दी': 'turmeric',
      'धनिया': 'coriander',
      'जीरा': 'cumin',
      'मसाला': 'spices',
      'तेल': 'oil',
      'नमक': 'salt',
      'चीनी': 'sugar',
      'आटा': 'flour',
      'मैदा': 'maida',
      'बेसन': 'gram flour',
      'दही': 'curd',
      'पनीर': 'paneer',
      'मक्खन': 'butter',
      'घी': 'ghee'
    };

    let fallbackText = text;
    for (const [hindi, english] of Object.entries(fallbackTranslations)) {
      fallbackText = fallbackText.replace(new RegExp(hindi, 'gi'), english);
    }

    if (fallbackText !== text) {
      console.log('✅ Using fallback translation:', fallbackText);
      return res.json({ 
        success: true, 
        translatedText: fallbackText,
        originalText: text,
        source,
        target,
        method: 'fallback'
      });
    }

    // If no translation possible, return original text
    console.log('⚠️ No translation available, returning original text');
    return res.json({ 
      success: true, 
      translatedText: text,
      originalText: text,
      source,
      target,
      method: 'original'
    });

  } catch (error) {
    console.error('❌ Translation error:', error);
    res.status(500).json({ 
      error: 'Translation failed', 
      message: error.message,
      fallback: 'Using original text'
    });
  }
});

// Keyword analytics and suggestions (no auth required)
router.get('/trending', getTrendingKeywords);
router.get('/suggestions', getKeywordSuggestions);
router.get('/analytics', getKeywordAnalytics);

// Existing routes
router.post('/', verifyFirebaseToken, searchProducts);
router.post('/name', verifyFirebaseToken, searchProductsByName);
router.post('/category', verifyFirebaseToken, searchProductsByCategory);
router.get('/stats', verifyFirebaseToken, getSearchStats);
router.get('/health', searchHealthCheck);

export default router; 