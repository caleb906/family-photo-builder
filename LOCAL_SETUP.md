# Local Development Setup Guide

## Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Local Database
The app is configured to use SQLite for local development. Run:

```bash
npx prisma db push
```

This creates a `prisma/dev.db` file with all tables ready.

### Step 3: Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## ✅ All Code Fixes Are Already Applied!

The onClick handler errors have been fixed:
- ✅ DeleteWeddingButton component created
- ✅ DeletePersonButton component created
- ✅ DeleteGroupButton component created
- ✅ AddCoupleButton component created
- ✅ CopyLinkButton component created
- ✅ Groups page updated to use client components

**The app should work perfectly locally!**

---

## Troubleshooting

### If `npx prisma db push` fails:

Try generating the Prisma client first:
```bash
npx prisma generate
npx prisma db push
```

### If port 3000 is in use:
```bash
npm run dev -- -p 3001
```

### If you see build errors:
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Database issues:
```bash
# Reset database
rm -f prisma/dev.db
npx prisma db push
```

---

## What's Configured

### Local Environment (.env)
```
DATABASE_URL="file:./dev.db"
```

### Database (prisma/schema.prisma)
- Provider: SQLite (for local dev)
- File location: `prisma/dev.db`
- All models: Wedding, Person, PhotoGroup, PhotoGroupPerson

### Available Scripts
```bash
npm run dev         # Start dev server (port 3000)
npm run build       # Build for production
npm run start       # Start production server
npm run lint        # Run linter
npm run db:push     # Update database schema
npm run db:studio   # Open Prisma Studio GUI
```

---

## Testing the App

1. **Create a Wedding**
   - Go to home page
   - Click "Create New Wedding"
   - Enter bride and groom names
   - Add wedding date (optional)

2. **Add People**
   - From wedding dashboard, click "People"
   - Add family members with names, sides, relationships
   - Mark divorced parents if applicable

3. **Create Photo Groups**
   - Click "Photo Groups"
   - Use "Generate Suggested Groups" for quick start
   - Or manually create groups
   - Use "Add Couple" button to quickly select bride + groom

4. **Use Shot List**
   - Click "Shot List"
   - Mark groups as Ready → Shot during the wedding
   - Track progress with visual percentage

5. **Print**
   - Click "Print Version" for a clean printable list

---

## Next Steps

Once local development works, see `VERCEL_DEPLOYMENT_GUIDE.md` for deploying to Vercel!
