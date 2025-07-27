#!/usr/bin/env node

/**
 * Setup script for SupplyLink Backend Server
 * This script helps with initial configuration and validation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function dirname(filePath) {
  return path.dirname(filePath);
}

console.log('🚀 SupplyLink Backend Server Setup');
console.log('=====================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Server Configuration
PORT=5000
NODE_ENV=development

# Firebase Admin SDK Configuration
# Option 1: Service account file path
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json

# Option 2: Service account JSON (uncomment and add your JSON)
# FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"supplylink-671f6",...}

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Database Configuration (for future use)
# DATABASE_URL=mongodb://localhost:27017/supplylink
# DATABASE_URL=postgresql://username:password@localhost:5432/supplylink
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully');
} else {
  console.log('✅ .env file already exists');
}

// Check if Firebase service account file exists
const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.log('\n⚠️  Firebase service account file not found');
  console.log('📋 To complete setup:');
  console.log('   1. Go to Firebase Console → Project Settings → Service Accounts');
  console.log('   2. Click "Generate New Private Key"');
  console.log('   3. Download the JSON file');
  console.log('   4. Rename it to "firebase-service-account.json"');
  console.log('   5. Place it in the server/ directory');
  console.log('\n   OR');
  console.log('   1. Copy the service account JSON content');
  console.log('   2. Add it to .env as FIREBASE_SERVICE_ACCOUNT_JSON');
} else {
  console.log('✅ Firebase service account file found');
}

// Check if node_modules exists
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('\n📦 Installing dependencies...');
  console.log('   Run: npm install');
} else {
  console.log('✅ Dependencies installed');
}

// Check package.json
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log(`✅ Package.json found (version: ${packageJson.version})`);
} else {
  console.log('❌ Package.json not found');
}

console.log('\n📋 Next Steps:');
console.log('   1. Install dependencies: npm install');
console.log('   2. Add Firebase service account credentials');
console.log('   3. Start the server: npm run dev');
console.log('   4. Test the API: curl http://localhost:5000/health');

console.log('\n🔗 Useful URLs:');
console.log('   - Server Health: http://localhost:5000/health');
console.log('   - API Base: http://localhost:5000/api');
console.log('   - Documentation: See README.md');

console.log('\n🎉 Setup complete! Happy coding! 🚀'); 