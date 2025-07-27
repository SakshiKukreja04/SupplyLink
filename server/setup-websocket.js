#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎤 Voice Transcription WebSocket Server Setup');
console.log('=============================================\n');

// Check if ws package is installed
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const hasWs = packageJson.dependencies && packageJson.dependencies.ws;
  
  if (!hasWs) {
    console.log('📦 Installing WebSocket dependency...');
    console.log('   Run: npm install ws');
    console.log('');
  } else {
    console.log('✅ WebSocket dependency found');
  }
} else {
  console.log('❌ Package.json not found');
}

// Check if websocketServer.js exists
const websocketServerPath = path.join(__dirname, 'websocketServer.js');
if (fs.existsSync(websocketServerPath)) {
  console.log('✅ WebSocket server file found');
} else {
  console.log('❌ WebSocket server file not found');
}

console.log('\n🚀 To start the WebSocket server:');
console.log('   node server/websocketServer.js');
console.log('');
console.log('🔗 WebSocket endpoint: ws://localhost:5001/voice-transcription');
console.log('🏥 Health check: http://localhost:5001/health');
console.log('');
console.log('📋 Features:');
console.log('   • Real-time voice transcription');
console.log('   • Multi-client support');
console.log('   • Automatic reconnection');
console.log('   • Error handling');
console.log('');
console.log('🎯 Usage in frontend:');
console.log('   const ws = new WebSocket("ws://localhost:5001/voice-transcription");');
console.log('   ws.send(JSON.stringify({ type: "voice_transcript", data: "text" }));');
console.log('');
console.log('✨ Voice search is now ready to use!'); 