# Keyword Extraction & Storage System

## Overview

This system automatically extracts keywords, quantities, and raw material names from user search queries and stores them in MongoDB for improved search relevance and analytics.

## Features

### 🔍 **Keyword Extraction**
- **Raw Material Detection**: Identifies product names in Hindi and English
- **Quantity Extraction**: Parses amounts with units (kg, liter, pieces, etc.)
- **Category Classification**: Categorizes searches (grains, vegetables, electronics, etc.)
- **Additional Keywords**: Captures quality indicators, location terms, etc.

### 📊 **Analytics & Insights**
- **Search Frequency Tracking**: Monitors how often keywords are searched
- **Trending Analysis**: Calculates trending scores based on frequency and recency
- **User Behavior**: Tracks user-specific search patterns
- **Category Analytics**: Provides insights by product categories

### 🔄 **Smart Suggestions**
- **Trending Keywords**: Shows popular search terms
- **Similar Keywords**: Suggests related searches
- **Category-based Recommendations**: Filters suggestions by category

## Database Schema

### SearchKeyword Model

```javascript
{
  // Original search query
  originalQuery: String,
  
  // Extracted keywords
  keywords: {
    rawMaterial: String,        // e.g., "rice", "potato"
    quantity: {
      value: Number,            // e.g., 5
      unit: String,             // e.g., "kg", "liter"
      originalText: String      // e.g., "5 किलो"
    },
    category: String,           // e.g., "grains", "vegetables"
    additionalKeywords: [String] // e.g., ["fresh", "organic"]
  },
  
  // Language information
  language: {
    detected: String,           // e.g., "hi", "en"
    confidence: Number          // e.g., 0.9
  },
  
  // Translation information
  translation: {
    originalText: String,       // e.g., "चावल 5 किलो"
    translatedText: String,     // e.g., "rice 5 kg"
    sourceLang: String,         // e.g., "hi"
    targetLang: String          // e.g., "en"
  },
  
  // Search metadata
  searchMetadata: {
    userId: String,             // Firebase user ID
    userRole: String,           // "vendor", "supplier", "admin"
    searchCount: Number,        // Times this keyword was searched
    lastSearched: Date,         // Last search timestamp
    searchResults: {
      totalFound: Number,       // Number of results found
      categories: [String]      // Categories of results
    }
  },
  
  // Popularity metrics
  popularity: {
    searchFrequency: Number,    // Total search count
    trendingScore: Number,      // Calculated trending score
    lastTrendingUpdate: Date    // Last score update
  }
}
```

## Supported Raw Materials

### Grains & Cereals
- **Rice**: चावल, भात, rice, chawal, bhat
- **Wheat**: गेहूं, wheat, gehun, atta
- **Lentils**: दाल, lentils, dal, pulses
- **Flour**: आटा, मैदा, बेसन, flour, atta, maida, besan

### Vegetables
- **Potato**: आलू, potato, alu
- **Tomato**: टमाटर, tomato, tamatar
- **Onion**: प्याज, onion, pyaz
- **Carrot**: गाजर, carrot, gajar
- **Brinjal**: बैंगन, brinjal, baingan, eggplant
- **Capsicum**: शिमला मिर्च, capsicum, bell pepper
- **Chili**: मिर्च, chili, mirch, pepper

### Fruits
- **Apple**: सेब, apple, seb
- **Banana**: केला, banana, kela
- **Orange**: संतरा, orange, santra
- **Mango**: आम, mango, aam

### Dairy & Proteins
- **Milk**: दूध, milk, doodh
- **Eggs**: अंडे, eggs, ande
- **Chicken**: चिकन, chicken, murga
- **Fish**: मछली, fish, machli
- **Meat**: मांस, meat, maas
- **Paneer**: पनीर, paneer, cottage cheese
- **Curd**: दही, curd, dahi, yogurt

### Spices & Condiments
- **Turmeric**: हल्दी, turmeric, haldi
- **Coriander**: धनिया, coriander, dhaniya
- **Cumin**: जीरा, cumin, jeera
- **Salt**: नमक, salt, namak
- **Sugar**: चीनी, sugar, chini
- **Oil**: तेल, oil, tel
- **Ghee**: घी, ghee, clarified butter

### Electronics
- **Laptop**: लैपटॉप, laptop, computer
- **Mobile**: मोबाइल, mobile, phone, फोन
- **Computer**: कंप्यूटर, computer, pc
- **Electronics**: इलेक्ट्रॉनिक्स, electronics, gadgets

## Supported Quantities

### Weight Units
- **kg**: kg, kilo, किलो, किलोग्राम, kilogram
- **gram**: gram, g, ग्राम, gm
- **ton**: ton, tonne, टन, tonnes

### Volume Units
- **liter**: liter, l, लीटर, litre
- **ml**: ml, milliliter, मिलीलीटर

### Count Units
- **piece**: piece, pc, pieces, टुकड़ा, टुकड़े
- **dozen**: dozen, dozens, दर्जन
- **pack**: pack, packs, पैक, पैकेट

### Hindi Numbers
- एक (1), दो (2), तीन (3), चार (4), पांच (5)
- छह (6), सात (7), आठ (8), नौ (9), दस (10)

## API Endpoints

### 1. Search with Keyword Extraction
```http
POST /api/search
Authorization: Bearer <firebase-token>
Content-Type: application/json

{
  "query": "चावल 5 किलो",
  "language": "hi"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "extractedKeywords": {
      "rawMaterial": "rice",
      "quantity": {
        "value": 5,
        "unit": "kg",
        "originalText": "5 किलो"
      },
      "category": "grains",
      "additionalKeywords": ["चावल", "किलो"]
    },
    "suggestions": {
      "trendingKeywords": [...]
    }
  }
}
```

### 2. Get Trending Keywords
```http
GET /api/search/trending?limit=10&category=vegetables
```

### 3. Get Keyword Suggestions
```http
GET /api/search/suggestions?query=rice&limit=5
```

### 4. Get Analytics
```http
GET /api/search/analytics?days=30
```

## Setup Instructions

### 1. Run Keyword Setup
```bash
cd server
node setup-keywords.js
```

### 2. Test the System
```bash
# Test keyword extraction
curl -X POST http://localhost:5000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query": "चावल 5 किलो"}'

# Get trending keywords
curl http://localhost:5000/api/search/trending

# Get analytics
curl http://localhost:5000/api/search/analytics
```

## Example Queries & Extractions

| Query | Raw Material | Quantity | Category | Additional Keywords |
|-------|-------------|----------|----------|-------------------|
| "चावल 5 किलो" | rice | 5 kg | grains | ["चावल", "किलो"] |
| "आलू 10 किलो" | potato | 10 kg | vegetables | ["आलू", "किलो"] |
| "दूध 2 लीटर" | milk | 2 liter | dairy | ["दूध", "लीटर"] |
| "लैपटॉप खरीदना" | laptop | null | electronics | ["खरीदना"] |
| "fresh vegetables" | null | null | vegetables | ["fresh"] |

## Trending Score Calculation

The trending score is calculated using:
```
trendingScore = log(searchFrequency + 1) × exp(-daysSinceCreation / 30)
```

This formula:
- Rewards higher search frequency
- Penalizes older keywords (decay over 30 days)
- Provides a balanced trending metric

## Benefits

### For Users
- **Better Search Results**: Relevant suggestions based on popular searches
- **Faster Search**: Auto-complete with trending keywords
- **Multilingual Support**: Works with Hindi and English queries

### For Analytics
- **Search Patterns**: Understand what users are looking for
- **Trending Items**: Identify popular products and categories
- **User Behavior**: Track search frequency and preferences
- **Market Insights**: Analyze demand patterns

### For System
- **Improved Relevance**: Better search results based on extracted keywords
- **Performance**: Optimized queries using indexed keywords
- **Scalability**: Efficient storage and retrieval of search data

## Future Enhancements

1. **Machine Learning**: Train models for better keyword extraction
2. **Synonyms**: Expand raw material patterns with more variations
3. **Context Awareness**: Consider user location and preferences
4. **Real-time Analytics**: Live dashboard for search trends
5. **Personalization**: User-specific keyword suggestions
6. **Seasonal Trends**: Track seasonal search patterns 