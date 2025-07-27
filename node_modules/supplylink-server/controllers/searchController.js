import Product from '../models/Product.js';
import translationService from '../services/translationService.js';
import KeywordExtractionService from '../services/keywordExtractionService.js';

/**
 * Search products using voice input with language detection and translation
 * @route POST /api/search
 * @access Public
 */
export const searchProducts = async (req, res) => {
  try {
    const { query, language } = req.body;
    const userId = req.user?.uid || null;
    const userRole = req.user?.role || 'vendor';

    // Validate input
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required and must be a non-empty string',
        error: 'INVALID_QUERY'
      });
    }

    const trimmedQuery = query.trim();
    console.log('🔍 Search request received:', {
      query: trimmedQuery,
      language: language || 'auto-detect',
      userId: userId,
      userRole: userRole,
      timestamp: new Date().toISOString()
    });

    // Step 1: Extract keywords from the query
    const keywordData = await KeywordExtractionService.extractKeywords(
      trimmedQuery, 
      userId, 
      userRole
    );

    // Step 2: Process text (detect language and translate if needed)
    const textProcessingResult = await translationService.processText(trimmedQuery);

    if (!textProcessingResult.success) {
      console.error('❌ Text processing failed:', textProcessingResult.error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process search query',
        error: 'TEXT_PROCESSING_FAILED',
        details: textProcessingResult.error
      });
    }

    // Step 3: Search products in MongoDB
    const searchQuery = textProcessingResult.processedText;
    console.log('🔎 Searching products with query:', searchQuery);

    const products = await Product.searchProducts(searchQuery, 20);

    // Step 4: Save search keyword with results
    if (keywordData) {
      // Update keyword data with translation info
      keywordData.language = {
        detected: textProcessingResult.detectedLanguage,
        confidence: textProcessingResult.confidence
      };
      keywordData.translation = {
        originalText: trimmedQuery,
        translatedText: searchQuery,
        sourceLang: textProcessingResult.detectedLanguage,
        targetLang: 'en'
      };

      await KeywordExtractionService.saveSearchKeyword(keywordData, products);
    }

    // Step 5: Format response
    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      stock: product.stock,
      supplier: {
        id: product.supplierId._id,
        name: product.supplierId.name,
        location: product.supplierId.location
      },
      createdAt: product.createdAt,
      updatedAt: product.updatedAt
    }));

    console.log(`✅ Search completed: Found ${formattedProducts.length} products`);

    // Step 6: Get trending keywords for suggestions
    const trendingKeywords = await KeywordExtractionService.getTrendingKeywords(5);

    // Step 7: Send response
    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: {
        products: formattedProducts,
        totalResults: formattedProducts.length,
        searchQuery: {
          original: trimmedQuery,
          processed: searchQuery,
          detectedLanguage: textProcessingResult.detectedLanguage,
          confidence: textProcessingResult.confidence,
          wasTranslated: textProcessingResult.wasTranslated
        },
        extractedKeywords: keywordData ? {
          rawMaterial: keywordData.keywords.rawMaterial,
          quantity: keywordData.keywords.quantity,
          category: keywordData.keywords.category,
          additionalKeywords: keywordData.keywords.additionalKeywords
        } : null,
        suggestions: {
          trendingKeywords: trendingKeywords.map(kw => ({
            query: kw.originalQuery,
            rawMaterial: kw.keywords.rawMaterial,
            category: kw.keywords.category,
            searchFrequency: kw.popularity.searchFrequency
          }))
        },
        metadata: {
          searchTime: new Date().toISOString(),
          queryLength: trimmedQuery.length,
          hasResults: formattedProducts.length > 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during search',
      error: 'SEARCH_FAILED',
      details: error.message
    });
  }
};

/**
 * Search products by name only
 * @route POST /api/search/name
 * @access Public
 */
export const searchProductsByName = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product name query is required',
        error: 'INVALID_QUERY'
      });
    }

    const trimmedQuery = query.trim();
    const textProcessingResult = await translationService.processText(trimmedQuery);

    if (!textProcessingResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process search query',
        error: 'TEXT_PROCESSING_FAILED'
      });
    }

    const products = await Product.searchByName(textProcessingResult.processedText, 20);

    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      stock: product.stock,
      supplier: {
        id: product.supplierId._id,
        name: product.supplierId.name,
        location: product.supplierId.location
      }
    }));

    res.status(200).json({
      success: true,
      message: 'Name search completed successfully',
      data: {
        products: formattedProducts,
        totalResults: formattedProducts.length,
        searchQuery: {
          original: trimmedQuery,
          processed: textProcessingResult.processedText,
          detectedLanguage: textProcessingResult.detectedLanguage,
          wasTranslated: textProcessingResult.wasTranslated
        }
      }
    });

  } catch (error) {
    console.error('❌ Name search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during name search',
      error: 'NAME_SEARCH_FAILED'
    });
  }
};

/**
 * Search products by category
 * @route POST /api/search/category
 * @access Public
 */
export const searchProductsByCategory = async (req, res) => {
  try {
    const { category } = req.body;

    if (!category || typeof category !== 'string' || category.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Category query is required',
        error: 'INVALID_CATEGORY'
      });
    }

    const trimmedCategory = category.trim();
    const textProcessingResult = await translationService.processText(trimmedCategory);

    if (!textProcessingResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process category query',
        error: 'TEXT_PROCESSING_FAILED'
      });
    }

    const products = await Product.searchByCategory(textProcessingResult.processedText, 20);

    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      stock: product.stock,
      supplier: {
        id: product.supplierId._id,
        name: product.supplierId.name,
        location: product.supplierId.location
      }
    }));

    res.status(200).json({
      success: true,
      message: 'Category search completed successfully',
      data: {
        products: formattedProducts,
        totalResults: formattedProducts.length,
        searchQuery: {
          original: trimmedCategory,
          processed: textProcessingResult.processedText,
          detectedLanguage: textProcessingResult.detectedLanguage,
          wasTranslated: textProcessingResult.wasTranslated
        }
      }
    });

  } catch (error) {
    console.error('❌ Category search error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during category search',
      error: 'CATEGORY_SEARCH_FAILED'
    });
  }
};

/**
 * Get search statistics
 * @route GET /api/search/stats
 * @access Public
 */
export const getSearchStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isActive: true });
    const categories = await Product.distinct('category');
    const translationHealth = await translationService.checkServiceHealth();

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        totalCategories: categories.length,
        categories: categories.slice(0, 10), // Show first 10 categories
        translationService: {
          available: translationHealth,
          status: translationHealth ? 'operational' : 'unavailable'
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Search stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch search statistics',
      error: 'STATS_FETCH_FAILED'
    });
  }
};

/**
 * Health check for search service
 * @route GET /api/search/health
 * @access Public
 */
export const searchHealthCheck = async (req, res) => {
  try {
    const dbStatus = await Product.db.db.admin().ping();
    const translationStatus = await translationService.checkServiceHealth();

    res.status(200).json({
      success: true,
      message: 'Search service health check',
      data: {
        database: {
          status: dbStatus.ok ? 'connected' : 'disconnected',
          ping: dbStatus.ok ? 'pong' : 'timeout'
        },
        translation: {
          status: translationStatus ? 'available' : 'unavailable',
          service: 'LibreTranslate'
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Search service health check failed',
      error: 'HEALTH_CHECK_FAILED'
    });
  }
}; 

/**
 * Get trending keywords for suggestions
 * @route GET /api/search/trending
 * @access Public
 */
export const getTrendingKeywords = async (req, res) => {
  try {
    const { limit = 10, category } = req.query;
    
    let keywords;
    if (category) {
      keywords = await KeywordExtractionService.getPopularKeywordsByCategory(category, parseInt(limit));
    } else {
      keywords = await KeywordExtractionService.getTrendingKeywords(parseInt(limit));
    }

    res.status(200).json({
      success: true,
      data: {
        keywords: keywords.map(kw => ({
          id: kw._id,
          originalQuery: kw.originalQuery,
          rawMaterial: kw.keywords.rawMaterial,
          quantity: kw.keywords.quantity,
          category: kw.keywords.category,
          searchFrequency: kw.popularity.searchFrequency,
          trendingScore: kw.popularity.trendingScore,
          lastSearched: kw.searchMetadata.lastSearched
        })),
        total: keywords.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting trending keywords:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending keywords',
      error: 'TRENDING_KEYWORDS_FAILED'
    });
  }
};

/**
 * Get keyword suggestions based on partial input
 * @route GET /api/search/suggestions
 * @access Public
 */
export const getKeywordSuggestions = async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;
    
    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required',
        error: 'MISSING_QUERY'
      });
    }

    const suggestions = await KeywordExtractionService.getSimilarKeywords(
      query.trim(), 
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      data: {
        suggestions: suggestions.map(s => ({
          query: s.originalQuery,
          rawMaterial: s.keywords.rawMaterial,
          category: s.keywords.category,
          searchFrequency: s.popularity.searchFrequency
        })),
        total: suggestions.length
      }
    });

  } catch (error) {
    console.error('❌ Error getting keyword suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get keyword suggestions',
      error: 'SUGGESTIONS_FAILED'
    });
  }
};

/**
 * Get keyword analytics and insights
 * @route GET /api/search/analytics
 * @access Public
 */
export const getKeywordAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    // Get trending keywords
    const trendingKeywords = await KeywordExtractionService.getTrendingKeywords(20);
    
    // Calculate analytics
    const totalSearches = trendingKeywords.reduce((sum, kw) => sum + kw.popularity.searchFrequency, 0);
    const uniqueMaterials = [...new Set(trendingKeywords.map(kw => kw.keywords.rawMaterial).filter(Boolean))];
    const uniqueCategories = [...new Set(trendingKeywords.map(kw => kw.keywords.category).filter(Boolean))];
    
    // Group by category
    const categoryStats = {};
    trendingKeywords.forEach(kw => {
      if (kw.keywords.category) {
        if (!categoryStats[kw.keywords.category]) {
          categoryStats[kw.keywords.category] = {
            count: 0,
            totalSearches: 0,
            keywords: []
          };
        }
        categoryStats[kw.keywords.category].count++;
        categoryStats[kw.keywords.category].totalSearches += kw.popularity.searchFrequency;
        categoryStats[kw.keywords.category].keywords.push({
          rawMaterial: kw.keywords.rawMaterial,
          searchFrequency: kw.popularity.searchFrequency
        });
      }
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalSearches,
          uniqueMaterials: uniqueMaterials.length,
          uniqueCategories: uniqueCategories.length,
          trendingKeywords: trendingKeywords.length
        },
        topMaterials: trendingKeywords
          .filter(kw => kw.keywords.rawMaterial)
          .slice(0, 10)
          .map(kw => ({
            material: kw.keywords.rawMaterial,
            searchFrequency: kw.popularity.searchFrequency,
            category: kw.keywords.category
          })),
        categoryStats,
        recentTrends: trendingKeywords
          .sort((a, b) => new Date(b.searchMetadata.lastSearched) - new Date(a.searchMetadata.lastSearched))
          .slice(0, 10)
          .map(kw => ({
            query: kw.originalQuery,
            rawMaterial: kw.keywords.rawMaterial,
            category: kw.keywords.category,
            lastSearched: kw.searchMetadata.lastSearched
          }))
      }
    });

  } catch (error) {
    console.error('❌ Error getting keyword analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get keyword analytics',
      error: 'ANALYTICS_FAILED'
    });
  }
}; 