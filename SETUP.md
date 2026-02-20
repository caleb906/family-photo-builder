# Quick Setup Guide

Follow these steps to get Family Photo Builder running:

## ⚡ Quick Start (3 steps)

### 1. Install Dependencies
```bash
npm install
```
Wait for all packages to download and install.

### 2. Setup Database
```bash
npx prisma db push
```
This creates your local database with all required tables.

### 3. Start Development Server
```bash
npm run dev
```

**Done!** Open http://localhost:3000 in your browser.

---

## 🎯 First Steps in the App

1. **Create Your First Wedding**
   - Click "Create New Wedding"
   - Enter bride and groom names
   - Optionally add wedding date

2. **Add Family Members**
   - Click "People" from the wedding dashboard
   - Add people from both bride's and groom's side
   - Include relationship info (Mom, Dad, Sibling, etc.)

3. **Build Photo Groups**
   - Click "Photo Groups"
   - Option A: Click "Generate Suggested Groups" for automatic templates
   - Option B: Manually create custom groups
   - Reorder, edit, or duplicate as needed

4. **Ready for Wedding Day**
   - Click "Shot List" to see organized list
   - Use status buttons (Not Ready → Ready → Shot)
   - Or click "Print Version" for paper backup

---

## 🛠️ Useful Commands

### View/Edit Database Directly
```bash
npm run db:studio
```
Opens Prisma Studio at http://localhost:5555

### Reset Database (Start Fresh)
```bash
rm -rf prisma/dev.db
npx prisma db push
```

### Build for Production
```bash
npm run build
npm run start
```

---

## 📱 Mobile Testing

To test on your phone while developing:

1. Find your computer's local IP address:
   - **Mac/Linux**: `ifconfig | grep "inet "`
   - **Windows**: `ipconfig`

2. Look for something like `192.168.1.xxx`

3. Start dev server:
   ```bash
   npm run dev
   ```

4. On your phone's browser, visit:
   ```
   http://192.168.1.xxx:3000
   ```
   (Replace with your actual IP)

---

## ❓ Troubleshooting

### "Port 3000 is already in use"
```bash
npm run dev -- -p 3001
```
Then visit http://localhost:3001

### "Cannot find module '@prisma/client'"
```bash
npx prisma generate
npm install
```

### Database issues after making changes
```bash
npx prisma db push --force-reset
```
⚠️ Warning: This deletes all data!

### App not updating after code changes
1. Stop the server (Ctrl+C)
2. Delete `.next` folder:
   ```bash
   rm -rf .next
   ```
3. Restart:
   ```bash
   npm run dev
   ```

---

## 💡 Tips

- **Backup your database**: The database file is at `prisma/dev.db` - copy it before major changes
- **Try Prisma Studio**: It's an easy way to view/edit data without using the app
- **Test print layout**: Use browser print preview to check formatting before wedding day
- **Mobile optimization**: The app works great on tablets - perfect for wedding day use

---

## 🎨 Customization

Want to change colors or styling? Edit these files:
- `tailwind.config.js` - Color palette and theme
- `src/app/globals.css` - Global styles and component classes

---

## 📦 What You Just Installed

- **Next.js 14**: React framework for the web app
- **TypeScript**: Type-safe JavaScript
- **Prisma**: Database toolkit
- **Tailwind CSS**: Utility-first CSS framework
- **SQLite**: Local database (perfect for single-user apps)

No authentication or external services needed - everything runs locally!

---

Need help? Check the main README.md for detailed documentation.
