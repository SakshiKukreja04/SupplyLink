const axios = require('axios');

console.log('🔍 Debugging Search Functionality');
console.log('==================================');
console.log('');

// Test LibreTranslate without API key
async function testLibreTranslate() {
  console.log('1. Testing LibreTranslate without API key...');
  
  try {
    // Test language detection
    const detectResponse = await axios.post('https://libretranslate.de/detect', {
      q: 'प्याज'
    }, {
      timeout: 10000
    });
    
    console.log('✅ Language detection successful:', detectResponse.data[0]);
    
    // Test translation
    const translateResponse = await axios.post('https://libretranslate.de/translate', {
      q: 'प्याज',
      source: 'hi',
      target: 'en'
    }, {
      timeout: 15000
    });
    
    console.log('✅ Translation successful:', translateResponse.data.translatedText);
    
    return {
      success: true,
      detectedLanguage: detectResponse.data[0],
      translatedText: translateResponse.data.translatedText
    };
  } catch (error) {
    console.log('❌ LibreTranslate failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Test search endpoint
async function testSearchEndpoint() {
  console.log('\n2. Testing search endpoint...');
  
  try {
    const response = await axios.post('http://localhost:5000/api/vendors/search', {
      keyword: 'onion',
      originalKeyword: 'प्याज',
      lat: 19.0459,
      lng: 72.8908,
      maxDistance: 10,
      minRating: 0,
      verifiedOnly: false,
      translationInfo: {
        wasTranslated: true,
        detectedLanguage: 'hi',
        processedText: 'onion'
      }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      timeout: 10000
    });
    
    console.log('✅ Search endpoint response:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Search endpoint failed:', error.response?.status, error.response?.data);
    return { success: false, error: error.message };
  }
}

// Test nearby suppliers endpoint
async function testNearbySuppliers() {
  console.log('\n3. Testing nearby suppliers endpoint...');
  
  try {
    const response = await axios.get('http://localhost:5000/api/suppliers/nearby?lat=19.0459&lng=72.8908&maxDistance=10', {
      headers: {
        'Authorization': 'Bearer test-token'
      },
      timeout: 10000
    });
    
    console.log('✅ Nearby suppliers response:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Nearby suppliers failed:', error.response?.status, error.response?.data);
    return { success: false, error: error.message };
  }
}

// Test database directly
async function testDatabaseQuery() {
  console.log('\n4. Testing database query...');
  
  try {
    const response = await axios.get('http://localhost:5000/api/debug/suppliers', {
      timeout: 10000
    });
    
    console.log('✅ Database query response:', response.data);
    return response.data;
  } catch (error) {
    console.log('❌ Database query failed:', error.response?.status, error.response?.data);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting search functionality debug...\n');
  
  // Test 1: LibreTranslate
  const libreResult = await testLibreTranslate();
  
  // Test 2: Search endpoint
  const searchResult = await testSearchEndpoint();
  
  // Test 3: Nearby suppliers
  const nearbyResult = await testNearbySuppliers();
  
  // Test 4: Database query
  const dbResult = await testDatabaseQuery();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`LibreTranslate: ${libreResult.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`Search Endpoint: ${searchResult.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`Nearby Suppliers: ${nearbyResult.success ? '✅ Working' : '❌ Failed'}`);
  console.log(`Database Query: ${dbResult.success ? '✅ Working' : '❌ Failed'}`);
  
  if (searchResult.success) {
    console.log(`\n🔍 Search Results: ${searchResult.suppliers?.length || 0} suppliers found`);
    if (searchResult.suppliers?.length === 0) {
      console.log('⚠️ No suppliers found - possible issues:');
      console.log('   - No suppliers in database');
      console.log('   - Suppliers don\'t have availableItems');
      console.log('   - Search keyword doesn\'t match any items');
      console.log('   - Distance/rating filters too restrictive');
    }
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Check if suppliers exist in database');
  console.log('2. Verify suppliers have availableItems with "onion"');
  console.log('3. Check distance calculations');
  console.log('4. Verify rating filters');
  console.log('5. Test with different search keywords');
}

// Run the tests
runTests().catch(console.error); 