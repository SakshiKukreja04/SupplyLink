#!/bin/bash

# SupplyLink Frontend Deployment Script

echo "🚀 Starting SupplyLink Frontend Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the client directory."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Please create it with your environment variables."
    echo "📝 See env.example for reference."
fi

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📁 Build output is in the 'dist' directory"
    
    # Check if Vercel CLI is installed
    if command -v vercel &> /dev/null; then
        echo "🚀 Deploying to Vercel..."
        vercel --prod
    else
        echo "📋 Vercel CLI not found. Please install it with: npm install -g vercel"
        echo "🔗 Or deploy manually through the Vercel dashboard"
    fi
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi 