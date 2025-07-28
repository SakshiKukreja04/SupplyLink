import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧪 Testing build process...');

try {
  // Clean install
  console.log('📦 Installing dependencies...');
  execSync('npm install --legacy-peer-deps --force', { stdio: 'inherit' });
  
  // Run build
  console.log('🔨 Running build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Verify build output
  if (!fs.existsSync('dist/index.html')) {
    throw new Error('Build failed: index.html not found');
  }
  
  console.log('✅ Build successful!');
  console.log('📁 Build output verified');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 