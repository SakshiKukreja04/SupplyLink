import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// LibreTranslate configuration
const LIBRE_TRANSLATE_URL = process.env.LIBRE_TRANSLATE_URL || 'https://libretranslate.de';
const LIBRE_TRANSLATE_API_KEY = process.env.LIBRE_TRANSLATE_API_KEY;

class TranslationService {
  constructor() {
    this.baseURL = LIBRE_TRANSLATE_URL;
    this.apiKey = LIBRE_TRANSLATE_API_KEY;
  }

  /**
   * Normalize language code for LibreTranslate
   * @param {string} langCode - Language code to normalize
   * @returns {string} - Normalized language code
   */
  normalizeLanguageCode(langCode) {
    const languageMap = {
      'hi-IN': 'hi',
      'mr-IN': 'mr',
      'en-IN': 'en',
      'en-US': 'en',
      'auto': 'en'
    };
    
    return languageMap[langCode] || langCode;
  }

  /**
   * Detect the language of the given text
   * @param {string} text - Text to detect language for
   * @returns {Promise<Object>} - Language detection result
   */
  async detectLanguage(text) {
    try {
      console.log('🔍 Detecting language for:', text.substring(0, 50) + '...');
      
      // Try LibreTranslate without API key first
      try {
        const response = await axios.post(`${this.baseURL}/detect`, {
          q: text
        }, {
          timeout: 10000 // 10 second timeout
        });

        const detectedLanguage = response.data[0];
        console.log('✅ Language detected via LibreTranslate:', detectedLanguage);

        return {
          success: true,
          language: detectedLanguage.language,
          confidence: detectedLanguage.confidence,
          originalText: text
        };
      } catch (libreError) {
        console.log('⚠️ LibreTranslate failed, trying with API key...');
        
        // If no API key is configured, use fallback detection
        if (!this.apiKey) {
          console.log('⚠️ No LibreTranslate API key configured, using fallback detection');
          return this.fallbackLanguageDetection(text);
        }
        
        // Try with API key
        const response = await axios.post(`${this.baseURL}/detect`, {
          q: text,
          api_key: this.apiKey
        }, {
          timeout: 10000 // 10 second timeout
        });

        const detectedLanguage = response.data[0];
        console.log('✅ Language detected via LibreTranslate with API key:', detectedLanguage);

        return {
          success: true,
          language: detectedLanguage.language,
          confidence: detectedLanguage.confidence,
          originalText: text
        };
      }
    } catch (error) {
      console.error('❌ Language detection error:', error.message);
      
      // Fallback: try to detect common Indian languages
      const textLower = text.toLowerCase();
      if (textLower.includes('चावल') || textLower.includes('दाल') || textLower.includes('रोटी')) {
        return {
          success: true,
          language: 'hi',
          confidence: 0.8,
          originalText: text,
          fallback: true
        };
      }
      if (textLower.includes('भात') || textLower.includes('दाल') || textLower.includes('पोळी')) {
        return {
          success: true,
          language: 'mr',
          confidence: 0.8,
          originalText: text,
          fallback: true
        };
      }
      
      return {
        success: false,
        error: error.message,
        originalText: text
      };
    }
  }

  /**
   * Fallback language detection when API key is not available
   * @param {string} text - Text to detect language for
   * @returns {Object} - Language detection result
   */
  fallbackLanguageDetection(text) {
    const textLower = text.toLowerCase();
    
    // Hindi detection patterns
    const hindiPatterns = [
      'चावल', 'दाल', 'रोटी', 'प्याज', 'टमाटर', 'आलू', 'गाजर', 'मटर',
      'खोजें', 'खरीदें', 'बेचें', 'कीमत', 'मात्रा', 'किलो', 'ग्राम'
    ];
    
    // Marathi detection patterns
    const marathiPatterns = [
      'भात', 'दाल', 'पोळी', 'कांदा', 'टोमॅटो', 'बटाटा', 'गाजर', 'मटार',
      'शोधा', 'विकत घ्या', 'विका', 'किंमत', 'प्रमाण', 'किलो', 'ग्रॅम'
    ];
    
    // Check for Hindi patterns
    for (const pattern of hindiPatterns) {
      if (textLower.includes(pattern)) {
        return {
          success: true,
          language: 'hi',
          confidence: 0.9,
          originalText: text,
          fallback: true
        };
      }
    }
    
    // Check for Marathi patterns
    for (const pattern of marathiPatterns) {
      if (textLower.includes(pattern)) {
        return {
          success: true,
          language: 'mr',
          confidence: 0.9,
          originalText: text,
          fallback: true
        };
      }
    }
    
    // Default to English if no patterns match
    return {
      success: true,
      language: 'en',
      confidence: 0.8,
      originalText: text,
      fallback: true
    };
  }

  /**
   * Translate text from source language to target language
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code (default: 'en')
   * @returns {Promise<Object>} - Translation result
   */
  async translateText(text, sourceLang, targetLang = 'en') {
    try {
      // If source language is already English, return the original text
      if (sourceLang === 'en') {
        return {
          success: true,
          originalText: text,
          translatedText: text,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang
        };
      }

      // Normalize language codes
      const normalizedSource = this.normalizeLanguageCode(sourceLang);
      const normalizedTarget = this.normalizeLanguageCode(targetLang);

      console.log(`🔄 Translating from ${normalizedSource} to ${normalizedTarget}:`, text.substring(0, 50) + '...');

      // Try LibreTranslate without API key first
      try {
        const response = await axios.post(`${this.baseURL}/translate`, {
          q: text,
          source: normalizedSource,
          target: normalizedTarget
        }, {
          timeout: 15000 // 15 second timeout
        });

        const translatedText = response.data.translatedText;
        console.log('✅ Translation completed via LibreTranslate:', translatedText.substring(0, 50) + '...');

        return {
          success: true,
          originalText: text,
          translatedText: translatedText,
          sourceLanguage: normalizedSource,
          targetLanguage: normalizedTarget
        };
      } catch (libreError) {
        console.log('⚠️ LibreTranslate failed, trying with API key...');
        
        // If no API key is configured, use fallback translation
        if (!this.apiKey) {
          console.log('⚠️ No LibreTranslate API key configured, using fallback translation');
          return this.fallbackTranslation(text, sourceLang, targetLang);
        }
        
        // Try with API key
        const response = await axios.post(`${this.baseURL}/translate`, {
          q: text,
          source: normalizedSource,
          target: normalizedTarget,
          api_key: this.apiKey
        }, {
          timeout: 15000 // 15 second timeout
        });

        const translatedText = response.data.translatedText;
        console.log('✅ Translation completed via LibreTranslate with API key:', translatedText.substring(0, 50) + '...');

        return {
          success: true,
          originalText: text,
          translatedText: translatedText,
          sourceLanguage: normalizedSource,
          targetLanguage: normalizedTarget
        };
      }
    } catch (error) {
      console.error('❌ Translation error:', error.message);
      
      // Fallback translations for common phrases
      const fallbackTranslations = {
        'चावल': 'rice',
        'दाल': 'lentils',
        'रोटी': 'bread',
        'भात': 'rice',
        'पोळी': 'bread',
        'लैपटॉप': 'laptop',
        'कंप्यूटर': 'computer',
        'मोबाइल': 'mobile',
        'फोन': 'phone'
      };
      
      const textLower = text.toLowerCase();
      for (const [hindi, english] of Object.entries(fallbackTranslations)) {
        if (textLower.includes(hindi)) {
          const fallbackText = text.replace(new RegExp(hindi, 'gi'), english);
          return {
            success: true,
            originalText: text,
            translatedText: fallbackText,
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            fallback: true
          };
        }
      }
      
      return {
        success: false,
        error: error.message,
        originalText: text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang
      };
    }
  }

  /**
   * Fallback translation when API key is not available
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language code
   * @param {string} targetLang - Target language code
   * @returns {Object} - Translation result
   */
  fallbackTranslation(text, sourceLang, targetLang) {
    // If source language is already English, return the original text
    if (sourceLang === 'en') {
      return {
        success: true,
        originalText: text,
        translatedText: text,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        fallback: true
      };
    }

    // Fallback translations for common phrases
    const fallbackTranslations = {
      'चावल': 'rice',
      'दाल': 'lentils',
      'रोटी': 'bread',
      'प्याज': 'onion',
      'टमाटर': 'tomato',
      'आलू': 'potato',
      'गाजर': 'carrot',
      'मटर': 'peas',
      'भात': 'rice',
      'पोळी': 'bread',
      'कांदा': 'onion',
      'टोमॅटो': 'tomato',
      'बटाटा': 'potato',
      'मटार': 'peas',
      'लैपटॉप': 'laptop',
      'कंप्यूटर': 'computer',
      'मोबाइल': 'mobile',
      'फोन': 'phone'
    };
    
    const textLower = text.toLowerCase();
    let translatedText = text;
    let translationFound = false;
    
    for (const [source, target] of Object.entries(fallbackTranslations)) {
      if (textLower.includes(source)) {
        translatedText = translatedText.replace(new RegExp(source, 'gi'), target);
        translationFound = true;
      }
    }
    
    return {
      success: true,
      originalText: text,
      translatedText: translationFound ? translatedText : text,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      fallback: true
    };
  }

  /**
   * Clean text by removing unnecessary punctuation and symbols
   * @param {string} text - Text to clean
   * @returns {string} - Cleaned text
   */
  cleanText(text) {
    if (!text) return text;
    
    // Remove Hindi/Devanagari punctuation marks and symbols
    const hindiPunctuation = /[।॥॰‌‍]/g;
    
    // Remove common punctuation marks that might interfere with search
    const punctuation = /[?!.,;:()\[\]{}"'`~@#$%^&*+=|\\/<>]/g;
    
    // Remove extra whitespace
    const extraWhitespace = /\s+/g;
    
    // Clean the text
    let cleanedText = text
      .replace(hindiPunctuation, '') // Remove Hindi punctuation
      .replace(punctuation, '') // Remove common punctuation
      .replace(extraWhitespace, ' ') // Normalize whitespace
      .trim(); // Remove leading/trailing spaces
    
    console.log(`🧹 Text cleaning: "${text}" → "${cleanedText}"`);
    
    return cleanedText;
  }

  /**
   * Detect language and translate to English if needed
   * @param {string} text - Text to process
   * @returns {Promise<Object>} - Processing result
   */
  async processText(text) {
    try {
      // Step 1: Clean the input text
      const cleanedInputText = this.cleanText(text);
      console.log(`🔍 Processing text: "${text}" → cleaned: "${cleanedInputText}"`);
      
      // Step 2: Detect language
      const detectionResult = await this.detectLanguage(cleanedInputText);
      
      if (!detectionResult.success) {
        return {
          success: false,
          error: 'Language detection failed',
          originalText: text,
          cleanedText: cleanedInputText
        };
      }

      // Step 3: Translate if not English
      if (detectionResult.language !== 'en') {
        const translationResult = await this.translateText(
          cleanedInputText, 
          detectionResult.language, 
          'en'
        );

        // Step 4: Clean the translated text
        const cleanedTranslatedText = this.cleanText(translationResult.translatedText);
        console.log(`🔄 Translation: "${cleanedInputText}" → "${translationResult.translatedText}" → cleaned: "${cleanedTranslatedText}"`);

        return {
          success: true,
          originalText: text,
          processedText: cleanedTranslatedText,
          detectedLanguage: detectionResult.language,
          confidence: detectionResult.confidence,
          wasTranslated: true,
          fallback: detectionResult.fallback || translationResult.fallback
        };
      }

      // Text is already in English - clean it
      const cleanedEnglishText = this.cleanText(cleanedInputText);
      console.log(`✅ English text cleaned: "${cleanedInputText}" → "${cleanedEnglishText}"`);

      return {
        success: true,
        originalText: text,
        processedText: cleanedEnglishText,
        detectedLanguage: 'en',
        confidence: detectionResult.confidence,
        wasTranslated: false
      };
    } catch (error) {
      console.error('❌ Text processing error:', error.message);
      return {
        success: false,
        error: error.message,
        originalText: text
      };
    }
  }

  /**
   * Get supported languages from LibreTranslate
   * @returns {Promise<Array>} - List of supported languages
   */
  async getSupportedLanguages() {
    try {
      const response = await axios.get(`${this.baseURL}/languages`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching supported languages:', error.message);
      return [];
    }
  }

  /**
   * Check if LibreTranslate service is available
   * @returns {Promise<boolean>} - Service availability
   */
  async checkServiceHealth() {
    try {
      const response = await axios.get(`${this.baseURL}/languages`, {
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      console.error('❌ LibreTranslate service unavailable:', error.message);
      return false;
    }
  }
}

export default new TranslationService(); 