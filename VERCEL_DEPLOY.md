# Deploy to Vercel - Complete Guide

## 🚀 Quick Deploy (Recommended)

### Option 1: Deploy from GitHub (Best Practice)

1. **Push to GitHub:**
```bash
cd family-photo-builder
git init
git add .
git commit -m "Initial commit - Family Photo Builder"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/family-photo-builder.git
git push -u origin main
```

2. **Deploy on Vercel:**
   - Go to https://vercel.com
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js
   - Click "Deploy"

3. **Configure Environment:**
   - After first deploy, go to Project Settings → Environment Variables
   - Add: `DATABASE_URL` = `file:./dev.db`
   - Redeploy

---

## Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (from project root)
cd family-photo-builder
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? family-photo-builder
# - Directory? ./
# - Override settings? No
```

---

## 📋 Pre-Deployment Checklist

### 1. Update .gitignore
Make sure these are in `.gitignore`:
```
node_modules
.next
.env
.env.local
*.db
*.db-journal
.vercel
```

### 2. Database Configuration

**For Production, you need a real database (SQLite won't work on Vercel).**

Choose one:

#### Option A: Vercel Postgres (Easiest)
```bash
# In Vercel dashboard:
# Storage → Create Database → Postgres
# Copy the connection string

# Update your .env:
DATABASE_URL="postgres://..."
```

#### Option B: PlanetScale (Free tier available)
```bash
# Sign up at planetscale.com
# Create database
# Get connection string

# Update your .env:
DATABASE_URL="mysql://..."
```

#### Option C: Supabase (Free tier available)
```bash
# Sign up at supabase.com
# Create project
# Get Postgres connection string

# Update your .env:
DATABASE_URL="postgres://..."
```

### 3. Update Prisma Schema for Production

**If using Postgres (recommended):**

Edit `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Changed from "sqlite"
  url      = env("DATABASE_URL")
}
```

**If using MySQL/PlanetScale:**
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"  // Add this for PlanetScale
}
```

### 4. Run Migrations for Production DB

```bash
# After updating DATABASE_URL to production DB:
npx prisma migrate dev --name init
npx prisma generate
```

---

## 🔧 Vercel Configuration

Create `vercel.json` in project root:

```json
{
  "buildCommand": "prisma generate && next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

---

## 🌍 Environment Variables on Vercel

In Vercel Dashboard → Project Settings → Environment Variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | Your production database URL | Production, Preview |
| `NODE_ENV` | `production` | Production |

---

## 📦 Build Settings

Vercel should auto-detect, but verify:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (or custom with prisma)
- **Output Directory:** `.next`
- **Install Command:** `npm install`
- **Development Command:** `npm run dev`

---

## 🚨 Common Issues & Fixes

### Issue: "Prisma Client not found"
**Fix:** Add build script in `package.json`:
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### Issue: Database connection fails
**Fix:** 
- Make sure DATABASE_URL is set in Vercel environment variables
- Use a production database (not SQLite)
- Check connection string format

### Issue: "Module not found" errors
**Fix:** 
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build timeout
**Fix:** In Vercel dashboard:
- Settings → General → Build & Development Settings
- Increase timeout or optimize build

---

## 🎯 Post-Deployment Steps

1. **Test the deployment:**
   - Visit your Vercel URL
   - Create a test wedding
   - Add test people
   - Build photo groups
   - Test couple form link

2. **Set up custom domain (optional):**
   - Vercel Dashboard → Domains
   - Add your domain
   - Update DNS records as instructed

3. **Monitor:**
   - Check Vercel Analytics
   - Review error logs if issues arise

---

## 💾 Database Persistence

**IMPORTANT:** Vercel's filesystem is ephemeral (files reset on each deploy).

For persistent data, you MUST use an external database:
- ✅ Vercel Postgres
- ✅ PlanetScale
- ✅ Supabase
- ✅ Railway
- ✅ Any hosted Postgres/MySQL

---

## 🔄 Continuous Deployment

Once connected to GitHub:
- Every push to `main` = automatic deployment
- Pull requests = preview deployments
- Instant rollbacks available

---

## 📞 Need Help?

**Vercel Errors:**
- Check deployment logs in Vercel dashboard
- Look for build errors or runtime errors

**Database Issues:**
- Verify connection string
- Check database service status
- Test connection locally first

**App Issues:**
- Check Vercel Functions logs
- Enable Vercel Analytics for insights
