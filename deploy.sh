#!/bin/bash
echo "🚀 Deploying SmartInvoice to Vercel..."
echo "=================================="

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

# Check deployment status
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "=================================="
    echo "✅ Your SmartInvoice app is now live!"
    echo "🌐 Domain: https://smartinvoice.com"
    echo "📊 Dashboard: https://vercel.com/dashboard"
    echo ""
    echo "🔧 Next steps:"
    echo "1. Set up environment variables in Vercel dashboard"
    echo "2. Configure custom domain (smartinvoice.com)"
    echo "3. Test all features on production"
    echo ""
    echo "🎯 Environment variables to add:"
    echo "- JWT_SECRET"
    echo "- EMAIL_HOST"
    echo "- EMAIL_USER"
    echo "- EMAIL_PASS"
    echo "- DATABASE_URL"
    echo ""
else
    echo "❌ Deployment failed! Please check the errors above."
    exit 1
fi