import SearchKeyword from '../models/SearchKeyword.js';

/**
 * Keyword Extraction Service
 * Extracts raw material names, quantities, and categories from search queries
 */
class KeywordExtractionService {
  
  // Common raw materials and their variations
  static rawMaterialPatterns = {
    // Grains and Cereals
    'rice': ['चावल', 'भात', 'rice', 'chawal', 'bhat'],
    'wheat': ['गेहूं', 'wheat', 'gehun', 'atta'],
    'lentils': ['दाल', 'lentils', 'dal', 'pulses'],
    'flour': ['आटा', 'मैदा', 'बेसन', 'flour', 'atta', 'maida', 'besan'],
    
    // Vegetables
    'potato': ['आलू', 'potato', 'alu'],
    'tomato': ['टमाटर', 'tomato', 'tamatar'],
    'onion': ['प्याज', 'onion', 'pyaz'],
    'carrot': ['गाजर', 'carrot', 'gajar'],
    'brinjal': ['बैंगन', 'brinjal', 'baingan', 'eggplant'],
    'capsicum': ['शिमला मिर्च', 'capsicum', 'bell pepper', 'shimla mirch'],
    'chili': ['मिर्च', 'chili', 'mirch', 'pepper'],
    
    // Fruits
    'apple': ['सेब', 'apple', 'seb'],
    'banana': ['केला', 'banana', 'kela'],
    'orange': ['संतरा', 'orange', 'santra'],
    'mango': ['आम', 'mango', 'aam'],
    
    // Dairy and Proteins
    'milk': ['दूध', 'milk', 'doodh'],
    'eggs': ['अंडे', 'eggs', 'ande'],
    'chicken': ['चिकन', 'chicken', 'murga'],
    'fish': ['मछली', 'fish', 'machli'],
    'meat': ['मांस', 'meat', 'maas'],
    'paneer': ['पनीर', 'paneer', 'cottage cheese'],
    'curd': ['दही', 'curd', 'dahi', 'yogurt'],
    
    // Spices and Condiments
    'turmeric': ['हल्दी', 'turmeric', 'haldi'],
    'coriander': ['धनिया', 'coriander', 'dhaniya'],
    'cumin': ['जीरा', 'cumin', 'jeera'],
    'salt': ['नमक', 'salt', 'namak'],
    'sugar': ['चीनी', 'sugar', 'chini'],
    'oil': ['तेल', 'oil', 'tel'],
    'ghee': ['घी', 'ghee', 'clarified butter'],
    
    // Electronics
    'laptop': ['लैपटॉप', 'laptop', 'computer'],
    'mobile': ['मोबाइल', 'mobile', 'phone', 'फोन'],
    'computer': ['कंप्यूटर', 'computer', 'pc'],
    'electronics': ['इलेक्ट्रॉनिक्स', 'electronics', 'gadgets']
  };

  // Quantity patterns with units
  static quantityPatterns = {
    // Weight units
    weight: {
      kg: ['kg', 'kilo', 'किलो', 'किलोग्राम', 'kilogram'],
      gram: ['gram', 'g', 'ग्राम', 'gm'],
      ton: ['ton', 'tonne', 'टन', 'tonnes']
    },
    // Volume units
    volume: {
      liter: ['liter', 'l', 'लीटर', 'litre'],
      ml: ['ml', 'milliliter', 'मिलीलीटर']
    },
    // Count units
    count: {
      piece: ['piece', 'pc', 'pieces', 'टुकड़ा', 'टुकड़े'],
      dozen: ['dozen', 'dozens', 'दर्जन'],
      pack: ['pack', 'packs', 'पैक', 'पैकेट']
    }
  };

  // Category patterns
  static categoryPatterns = {
    'grains': ['grains', 'cereals', 'अनाज', 'दाल', 'pulses'],
    'vegetables': ['vegetables', 'सब्जी', 'सब्जियां', 'veggies'],
    'fruits': ['fruits', 'फल', 'फलों'],
    'dairy': ['dairy', 'milk products', 'दूध', 'dairy products'],
    'meat': ['meat', 'non-veg', 'मांस', 'मीट'],
    'spices': ['spices', 'मसाला', 'मसाले', 'condiments'],
    'electronics': ['electronics', 'gadgets', 'इलेक्ट्रॉनिक्स', 'devices']
  };

  /**
   * Extract keywords from search query
   */
  static async extractKeywords(query, userId = null, userRole = 'vendor') {
    try {
      console.log('🔍 Extracting keywords from query:', query);
      
      const normalizedQuery = query.toLowerCase().trim();
      
      // Extract raw material
      const rawMaterial = this.extractRawMaterial(normalizedQuery);
      
      // Extract quantity
      const quantity = this.extractQuantity(normalizedQuery);
      
      // Extract category
      const category = this.extractCategory(normalizedQuery);
      
      // Extract additional keywords
      const additionalKeywords = this.extractAdditionalKeywords(normalizedQuery, rawMaterial, category);
      
      // Create keyword object
      const keywordData = {
        originalQuery: query,
        keywords: {
          rawMaterial: rawMaterial?.name || null,
          quantity: quantity || null,
          category: category?.name || null,
          additionalKeywords: additionalKeywords
        },
        searchMetadata: {
          userId: userId,
          userRole: userRole
        }
      };

      console.log('✅ Extracted keywords:', keywordData);
      
      return keywordData;
      
    } catch (error) {
      console.error('❌ Keyword extraction error:', error);
      return null;
    }
  }

  /**
   * Extract raw material name from query
   */
  static extractRawMaterial(query) {
    for (const [material, patterns] of Object.entries(this.rawMaterialPatterns)) {
      for (const pattern of patterns) {
        if (query.includes(pattern.toLowerCase())) {
          return {
            name: material,
            matchedPattern: pattern,
            confidence: 1.0
          };
        }
      }
    }
    return null;
  }

  /**
   * Extract quantity and unit from query
   */
  static extractQuantity(query) {
    // Number patterns (including Hindi numbers)
    const numberPatterns = [
      /(\d+)\s*(kg|kilo|किलो|किलोग्राम|kilogram)/i,
      /(\d+)\s*(gram|g|ग्राम|gm)/i,
      /(\d+)\s*(ton|tonne|टन|tonnes)/i,
      /(\d+)\s*(liter|l|लीटर|litre)/i,
      /(\d+)\s*(ml|milliliter|मिलीलीटर)/i,
      /(\d+)\s*(piece|pc|pieces|टुकड़ा|टुकड़े)/i,
      /(\d+)\s*(dozen|dozens|दर्जन)/i,
      /(\d+)\s*(pack|packs|पैक|पैकेट)/i,
      // Hindi numbers
      /(एक|दो|तीन|चार|पांच|छह|सात|आठ|नौ|दस)\s*(kg|किलो|gram|ग्राम|liter|लीटर)/i
    ];

    const hindiNumbers = {
      'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5,
      'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10
    };

    for (const pattern of numberPatterns) {
      const match = query.match(pattern);
      if (match) {
        let value = parseInt(match[1]);
        let unit = match[2];
        let originalText = match[0];

        // Handle Hindi numbers
        if (hindiNumbers[match[1]]) {
          value = hindiNumbers[match[1]];
        }

        // Normalize units
        if (['kilo', 'किलो', 'किलोग्राम', 'kilogram'].includes(unit)) {
          unit = 'kg';
        } else if (['gram', 'ग्राम', 'gm'].includes(unit)) {
          unit = 'gram';
        } else if (['liter', 'लीटर', 'litre'].includes(unit)) {
          unit = 'liter';
        }

        return {
          value: value,
          unit: unit,
          originalText: originalText
        };
      }
    }

    return null;
  }

  /**
   * Extract category from query
   */
  static extractCategory(query) {
    for (const [category, patterns] of Object.entries(this.categoryPatterns)) {
      for (const pattern of patterns) {
        if (query.includes(pattern.toLowerCase())) {
          return {
            name: category,
            matchedPattern: pattern,
            confidence: 1.0
          };
        }
      }
    }
    return null;
  }

  /**
   * Extract additional keywords
   */
  static extractAdditionalKeywords(query, rawMaterial, category) {
    const keywords = [];
    
    // Common search terms
    const searchTerms = [
      'search', 'find', 'look for', 'need', 'want', 'buy', 'purchase',
      'खोजें', 'शोधा', 'चाहिए', 'खरीदना', 'लेना'
    ];

    // Quality indicators
    const qualityTerms = [
      'fresh', 'organic', 'pure', 'natural', 'best', 'good', 'quality',
      'ताजा', 'जैविक', 'शुद्ध', 'प्राकृतिक', 'बेहतरीन', 'अच्छा'
    ];

    // Location indicators
    const locationTerms = [
      'near', 'nearby', 'local', 'delivery', 'pickup',
      'पास', 'नजदीक', 'स्थानीय', 'डिलीवरी', 'पिकअप'
    ];

    const allTerms = [...searchTerms, ...qualityTerms, ...locationTerms];
    
    for (const term of allTerms) {
      if (query.includes(term.toLowerCase())) {
        keywords.push(term);
      }
    }

    return keywords;
  }

  /**
   * Save search keyword to database
   */
  static async saveSearchKeyword(keywordData, searchResults = null) {
    try {
      // Check if similar keyword already exists
      const existingKeyword = await SearchKeyword.findOne({
        'keywords.rawMaterial': keywordData.keywords.rawMaterial,
        'keywords.category': keywordData.keywords.category
      });

      if (existingKeyword) {
        // Update existing keyword
        existingKeyword.popularity.searchFrequency += 1;
        existingKeyword.searchMetadata.lastSearched = new Date();
        existingKeyword.searchMetadata.searchCount += 1;
        
        if (searchResults) {
          existingKeyword.searchMetadata.searchResults = {
            totalFound: searchResults.length,
            categories: [...new Set(searchResults.map(item => item.category))]
          };
        }

        await existingKeyword.updateTrendingScore();
        await existingKeyword.save();
        
        console.log('✅ Updated existing search keyword:', existingKeyword._id);
        return existingKeyword;
      } else {
        // Create new keyword
        const newKeyword = new SearchKeyword({
          ...keywordData,
          searchMetadata: {
            ...keywordData.searchMetadata,
            searchResults: searchResults ? {
              totalFound: searchResults.length,
              categories: [...new Set(searchResults.map(item => item.category))]
            } : null
          }
        });

        await newKeyword.updateTrendingScore();
        await newKeyword.save();
        
        console.log('✅ Created new search keyword:', newKeyword._id);
        return newKeyword;
      }
    } catch (error) {
      console.error('❌ Error saving search keyword:', error);
      return null;
    }
  }

  /**
   * Get trending keywords
   */
  static async getTrendingKeywords(limit = 10) {
    try {
      return await SearchKeyword.findTrendingKeywords(limit);
    } catch (error) {
      console.error('❌ Error getting trending keywords:', error);
      return [];
    }
  }

  /**
   * Get similar keywords for suggestions
   */
  static async getSimilarKeywords(rawMaterial, limit = 5) {
    try {
      return await SearchKeyword.findByRawMaterial(rawMaterial, limit);
    } catch (error) {
      console.error('❌ Error getting similar keywords:', error);
      return [];
    }
  }

  /**
   * Get popular keywords by category
   */
  static async getPopularKeywordsByCategory(category, limit = 10) {
    try {
      return await SearchKeyword.findByCategory(category, limit);
    } catch (error) {
      console.error('❌ Error getting popular keywords by category:', error);
      return [];
    }
  }
}

export default KeywordExtractionService; 