# 🚀 Quick Start Guide

## For Local Development (Your Computer)

### Automatic Setup (Recommended)

**On Mac/Linux:**
```bash
./setup-local.sh
```

**On Windows:**
```bash
setup-local.bat
```

This script will:
- ✅ Install all dependencies
- ✅ Configure SQLite database
- ✅ Generate Prisma client
- ✅ Create database tables
- ✅ Verify everything works

**Then:**
```bash
npm run dev
```

Open http://localhost:3000 🎉

---

### Manual Setup

If the script doesn't work, run these commands:

```bash
# 1. Install dependencies
npm install

# 2. Make sure schema uses SQLite (check prisma/schema.prisma)
#    provider should be "sqlite" not "postgresql"

# 3. Generate Prisma client
npx prisma generate

# 4. Create database
npx prisma db push

# 5. Start dev server
npm run dev
```

---

## For Vercel Deployment (Production)

### Prerequisites
- ✅ Local app works (test first!)
- ✅ GitHub account
- ✅ Vercel account (free)

### Quick Deploy Steps

1. **Get a PostgreSQL Database**
   - Use Vercel Postgres (easiest)
   - Or Supabase (free)
   - Or Neon (free)

2. **Update Schema**
   ```prisma
   // In prisma/schema.prisma, change to:
   provider = "postgresql"
   ```

3. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Ready for deployment"
   git remote add origin https://github.com/YOUR_USERNAME/family-photo-builder.git
   git push -u origin main
   ```

4. **Deploy on Vercel**
   - Go to https://vercel.com
   - Import your GitHub repo
   - Add DATABASE_URL environment variable
   - Click Deploy

5. **Initialize Database**
   ```bash
   export DATABASE_URL="your-postgres-connection-string"
   npx prisma db push
   ```

**See VERCEL_DEPLOYMENT_GUIDE.md for detailed instructions!**

---

## ✅ Everything is Already Fixed!

All the onClick handler errors have been resolved:
- ✅ All client components created
- ✅ Server actions properly configured
- ✅ Groups page updated
- ✅ Delete confirmations working
- ✅ Add Couple button working

**The app is production-ready!**

---

## 📁 Helpful Files

| File | Purpose |
|------|---------|
| `LOCAL_SETUP.md` | Detailed local development guide |
| `VERCEL_DEPLOYMENT_GUIDE.md` | Complete Vercel deployment walkthrough |
| `setup-local.sh` | Automatic setup script (Mac/Linux) |
| `setup-local.bat` | Automatic setup script (Windows) |
| `README.md` | Full app documentation |
| `QUICKFIX.md` | Info about fixes already applied |

---

## 🆘 Troubleshooting

### Database won't create
```bash
rm -f prisma/dev.db
npx prisma generate
npx prisma db push
```

### Port 3000 in use
```bash
npm run dev -- -p 3001
```

### Dependencies issue
```bash
rm -rf node_modules package-lock.json
npm install
```

### Prisma errors
```bash
npx prisma generate
npx prisma db push
```

---

## 🎯 What This App Does

Family Photo Builder helps wedding photographers create organized shot lists:

1. **Create Weddings** - Track bride, groom, date
2. **Add People** - Family members, sides, relationships
3. **Build Groups** - Photo groupings with smart suggestions
4. **Shot List** - Day-of tracking with progress
5. **Print** - Clean printable checklist

---

## 💡 Tips

**First Time Setup:**
1. Run setup script OR manual setup
2. Test locally at http://localhost:3000
3. Create a sample wedding to verify everything works
4. Then deploy to Vercel when ready

**For Production:**
1. Make sure local version works perfectly
2. Follow Vercel deployment guide
3. Use PostgreSQL (not SQLite)
4. Test production deployment thoroughly

---

## 🎉 You're Ready!

Local development: **Run the setup script**
Production deploy: **Read VERCEL_DEPLOYMENT_GUIDE.md**

Questions? Check the other documentation files or the troubleshooting sections!
