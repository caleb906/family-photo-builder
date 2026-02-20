#!/bin/bash

echo "🚀 Family Photo Builder - Vercel Deployment Setup"
echo ""

# Check if git is initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - Family Photo Builder"
    git branch -M main
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Create a GitHub repository:"
echo "   - Go to https://github.com/new"
echo "   - Name it: family-photo-builder"
echo "   - Don't initialize with README"
echo ""
echo "2. Push to GitHub:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/family-photo-builder.git"
echo "   git push -u origin main"
echo ""
echo "3. Deploy on Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Click 'Add New' → 'Project'"
echo "   - Import your GitHub repository"
echo "   - Click 'Deploy'"
echo ""
echo "4. Add Environment Variables in Vercel:"
echo "   - Go to Project Settings → Environment Variables"
echo "   - Add DATABASE_URL (use Vercel Postgres or external DB)"
echo ""
echo "⚠️  IMPORTANT: You need a production database!"
echo "   SQLite won't work on Vercel. Use:"
echo "   - Vercel Postgres (easiest)"
echo "   - Supabase"
echo "   - PlanetScale"
echo ""
echo "📖 See VERCEL_DEPLOY.md for detailed instructions"
