#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🧪 Starting build test...');

try {
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json not found. Please run this script from the client directory.');
  }

  console.log('📦 Installing dependencies...');
  execSync('npm install --legacy-peer-deps --force', { stdio: 'inherit' });

  console.log('🔨 Running build...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if build output exists
  if (!fs.existsSync('dist')) {
    throw new Error('Build failed: dist directory not created');
  }

  if (!fs.existsSync('dist/index.html')) {
    throw new Error('Build failed: index.html not found in dist');
  }

  // Check for main assets
  const assetsDir = path.join('dist', 'assets');
  if (!fs.existsSync(assetsDir)) {
    throw new Error('Build failed: assets directory not found');
  }

  const assets = fs.readdirSync(assetsDir);
  const hasJsFiles = assets.some(file => file.endsWith('.js'));
  const hasCssFiles = assets.some(file => file.endsWith('.css'));

  if (!hasJsFiles) {
    throw new Error('Build failed: No JavaScript files found in assets');
  }

  if (!hasCssFiles) {
    throw new Error('Build failed: No CSS files found in assets');
  }

  console.log('✅ Build test passed!');
  console.log('📊 Build output:');
  console.log(`   - HTML: ${fs.statSync('dist/index.html').size} bytes`);
  console.log(`   - Assets: ${assets.length} files`);
  
  // Show asset sizes
  assets.forEach(file => {
    const filePath = path.join(assetsDir, file);
    const stats = fs.statSync(filePath);
    console.log(`   - ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
  });

} catch (error) {
  console.error('❌ Build test failed:', error.message);
  process.exit(1);
} 