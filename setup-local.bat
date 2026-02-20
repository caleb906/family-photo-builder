@echo off
echo ========================================
echo Family Photo Builder - Local Setup
echo ========================================
echo.

REM Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 18+ first.
    echo    Download from: https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Node.js found
node --version
echo.

REM Install dependencies
echo 📦 Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ❌ npm install failed. Please check the error above.
    pause
    exit /b 1
)
echo ✅ Dependencies installed
echo.

REM Configure for SQLite
echo 🔧 Configuring for local development (SQLite)...
findstr /C:"provider = \"sqlite\"" prisma\schema.prisma >nul
if %errorlevel% equ 0 (
    echo ✅ Prisma schema already configured for SQLite
) else (
    echo ⚠️  Updating schema to use SQLite...
    powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma"
    echo ✅ Schema updated to SQLite
)
echo.

REM Generate Prisma client
echo 🔄 Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Prisma generate failed. Please check the error above.
    pause
    exit /b 1
)
echo ✅ Prisma client generated
echo.

REM Push database schema
echo 💾 Creating local database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Database creation failed. Please check the error above.
    pause
    exit /b 1
)
echo ✅ Database created at prisma\dev.db
echo.

echo ========================================
echo 🎉 Setup Complete!
echo ========================================
echo.
echo 📝 Next steps:
echo    1. Run: npm run dev
echo    2. Open: http://localhost:3000
echo    3. Create your first wedding!
echo.
echo 📖 For Vercel deployment, see: VERCEL_DEPLOYMENT_GUIDE.md
echo.
pause
