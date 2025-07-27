// CORS Test Script - Testing All Origins Configuration
import fetch from 'node-fetch';

const testUrls = [
  'https://supply-link-git-main-sakshi-kukrejas-projects.vercel.app',
  'https://supply-link.vercel.app',
  'https://supplylink.vercel.app',
  'https://any-other-domain.com',
  'http://localhost:5173',
  'http://localhost:8080'
];

const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

async function testCORS() {
  console.log('🔍 Testing CORS for backend:', backendUrl);
  console.log('📋 Configuration: ALL ORIGINS ALLOWED');
  
  for (const origin of testUrls) {
    try {
      console.log(`\n📡 Testing origin: ${origin}`);
      
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: {
          'Origin': origin,
          'Content-Type': 'application/json'
        }
      });
      
      const corsHeader = response.headers.get('access-control-allow-origin');
      console.log(`✅ Status: ${response.status}`);
      console.log(`✅ CORS Header: ${corsHeader}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Response: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error(`❌ Error testing ${origin}:`, error.message);
    }
  }
  
  console.log('\n🎉 All origins should now be allowed!');
}

testCORS(); 