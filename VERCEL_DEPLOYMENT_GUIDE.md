# Vercel Deployment Guide - Complete Walkthrough

## 🚀 Quick Deploy (Recommended Method)

### Prerequisites
- ✅ Code is working locally (test with `npm run dev`)
- ✅ GitHub account
- ✅ Vercel account (free: https://vercel.com/signup)

---

## Step-by-Step Deployment

### Step 1: Prepare Database for Production

**IMPORTANT:** Vercel uses ephemeral file storage, so SQLite won't work. You need a hosted PostgreSQL database.

#### Option A: Vercel Postgres (Easiest - Recommended)

1. Go to https://vercel.com/dashboard
2. Click "Storage" → "Create Database" → "Postgres"
3. Name it: `family-photo-builder-db`
4. Select region (same as your app, e.g., `iad1` for US East)
5. Click "Create"
6. **Copy the DATABASE_URL** - you'll need this!

#### Option B: Supabase (Free Forever)

1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy "Connection String" (URI format)
5. Replace `[YOUR-PASSWORD]` with your actual password

#### Option C: Neon (Serverless Postgres - Free Tier)

1. Go to https://neon.tech
2. Create new project
3. Copy connection string from dashboard

---

### Step 2: Update Schema for PostgreSQL

Open `prisma/schema.prisma` and change:

```prisma
datasource db {
  provider = "postgresql"  // Change from "sqlite"
  url      = env("DATABASE_URL")
}
```

**Save this change!**

---

### Step 3: Push to GitHub

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Vercel deployment"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/family-photo-builder.git
git branch -M main
git push -u origin main
```

---

### Step 4: Deploy on Vercel

1. **Go to Vercel:**
   - Visit https://vercel.com
   - Sign in with GitHub

2. **Import Project:**
   - Click "Add New" → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project:**
   - Framework Preset: Next.js (should auto-detect)
   - Root Directory: `./` (leave default)
   - Build Command: `prisma generate && next build` (should be auto-filled from vercel.json)
   - Output Directory: `.next` (leave default)

4. **Add Environment Variables:**
   Click "Environment Variables" and add:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `postgresql://...` (paste your connection string from Step 1) |

5. **Deploy:**
   - Click "Deploy"
   - Wait 2-3 minutes for build
   - Vercel will show you the deployment URL!

---

### Step 5: Initialize Production Database

After first deployment, you need to push the schema to your production database:

```bash
# Set your production DATABASE_URL temporarily
export DATABASE_URL="postgresql://..."

# Push schema to production
npx prisma db push

# Or use Prisma migrate for production
npx prisma migrate deploy
```

**Alternative:** Use Vercel CLI to run migrations:
```bash
npm i -g vercel
vercel login
vercel env pull
npx prisma db push
```

---

## 🎯 Post-Deployment Checklist

After deployment completes:

- [ ] Visit your Vercel URL (e.g., `family-photo-builder.vercel.app`)
- [ ] Create a test wedding
- [ ] Add test people
- [ ] Create photo groups
- [ ] Test "Add Couple" button
- [ ] Test delete confirmations
- [ ] Generate suggested groups
- [ ] Check shot list page
- [ ] Test print version

---

## 🔄 Continuous Deployment

Once connected to GitHub:

- **Every push to `main` branch** = automatic deployment
- **Pull requests** = preview deployments
- **Instant rollbacks** available in Vercel dashboard

To update your app:
```bash
git add .
git commit -m "Your update message"
git push
```

Vercel automatically deploys within 2-3 minutes!

---

## 🌍 Custom Domain (Optional)

1. Go to Vercel project → Settings → Domains
2. Add your domain (e.g., `myweddings.com`)
3. Update your DNS records as instructed by Vercel
4. Wait for DNS propagation (5-10 minutes)

---

## 🐛 Troubleshooting

### Build Fails - "Prisma Client not found"

**Fix:** Make sure `vercel.json` has:
```json
{
  "buildCommand": "prisma generate && next build"
}
```

### Database Connection Error

**Fix:**
- Verify DATABASE_URL in Vercel dashboard → Settings → Environment Variables
- Make sure you ran `npx prisma db push` with production DATABASE_URL
- Check if database service is running

### "Module not found" errors

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
git add .
git commit -m "Fix dependencies"
git push
```

### Changes not showing

**Fix:**
- Hard refresh browser: `Ctrl+Shift+R` (or `Cmd+Shift+R` on Mac)
- Check Vercel dashboard for deployment status
- View deployment logs for errors

---

## 📊 Monitoring

**View Logs:**
- Vercel Dashboard → Your Project → Deployments
- Click on a deployment → View Function Logs

**Analytics:**
- Enable Vercel Analytics in project settings
- Track page views, performance, Web Vitals

**Error Tracking:**
- Check Runtime Logs for server errors
- Enable Vercel Monitoring for alerts

---

## 🔐 Environment Variables Management

**Add new variables:**
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Click "Add Another"
3. Select environments: Production, Preview, Development

**Pull to local:**
```bash
vercel env pull
```

---

## 💾 Database Backups

### Vercel Postgres
- Automatic daily backups
- Access via Vercel Dashboard → Storage → Your Database → Backups

### Supabase
- Automatic daily backups (free plan: 7 days retention)
- Manual backups via Dashboard → Database → Backups

### Manual Backup
```bash
# Export data
npx prisma db pull
npx prisma db execute --stdin < backup.sql
```

---

## 🚨 Important Notes

1. **SQLite doesn't work on Vercel** - you must use PostgreSQL
2. **Environment variables** must be set in Vercel dashboard (not .env file)
3. **Don't commit .env** - it's in .gitignore for security
4. **Database URL** should never be exposed in client-side code
5. **Free tier limits** - Check Vercel and database provider limits

---

## 📞 Getting Help

**Vercel Errors:**
- Check deployment logs in Vercel dashboard
- Visit Vercel Status page: https://www.vercel-status.com

**Database Issues:**
- Test connection string locally first
- Check database provider's status page
- Verify firewall/IP whitelist settings

**App Issues:**
- Check browser console for client errors
- Review Vercel Function Logs for server errors
- Test locally first: `npm run build && npm run start`

---

## ✅ Success!

Once deployed, you'll have:
- ✨ Live production app on Vercel
- 🔄 Automatic deployments on git push
- 💾 Persistent PostgreSQL database
- 🌍 Free HTTPS and global CDN
- 📊 Built-in analytics and monitoring

Share your Vercel URL with clients and start managing wedding photo lists! 🎉
