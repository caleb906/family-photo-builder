#!/bin/bash

echo "🎬 Family Photo Builder - Local Setup"
echo "====================================="
echo ""

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed. Please check the error above."
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Make sure we're using SQLite for local dev
echo "🔧 Configuring for local development (SQLite)..."

# Check if schema is set to sqlite
if grep -q 'provider = "sqlite"' prisma/schema.prisma; then
    echo "✅ Prisma schema already configured for SQLite"
else
    echo "⚠️  Updating schema to use SQLite for local development..."
    sed -i.bak 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma
    rm -f prisma/schema.prisma.bak
    echo "✅ Schema updated to SQLite"
fi

echo ""

# Generate Prisma client
echo "🔄 Generating Prisma client..."
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed. Please check the error above."
    exit 1
fi

echo "✅ Prisma client generated"
echo ""

# Push database schema
echo "💾 Creating local database..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Database creation failed. Please check the error above."
    exit 1
fi

echo "✅ Database created at prisma/dev.db"
echo ""

echo "🎉 Setup Complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Run: npm run dev"
echo "   2. Open: http://localhost:3000"
echo "   3. Create your first wedding!"
echo ""
echo "📖 For Vercel deployment, see: VERCEL_DEPLOYMENT_GUIDE.md"
echo ""
