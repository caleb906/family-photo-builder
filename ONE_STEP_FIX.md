# 🚨 ONE-STEP FIX - Replace Groups Page

## The Problem
The groups page still has inline onClick handlers that cause the error.

## The Solution  
**Replace the ENTIRE groups page file with the fixed version.**

## Steps:

### 1. Open This File:
```
src/app/weddings/[id]/groups/page.tsx
```

### 2. Delete Everything

### 3. Copy/Paste the FIXED Code
Open the file `FIXED-groups-page.txt` and copy ALL the code.

Paste it into your `groups/page.tsx` file.

### 4. Save and Restart
```bash
# Stop your dev server (Ctrl+C)
# Start it again
npm run dev
```

## Done! ✅

The groups page will now work without ANY onClick errors.

---

## 🎨 BONUS: Family Tree Visualization

I've also created a beautiful family tree component that shows:
- Visual organization by generation (grandparents → parents → siblings)
- Color-coded by side (pink for bride, blue for groom)
- Completeness check (alerts if missing key people)
- Stats summary

### To Add Family Tree:

**In `/src/app/weddings/[id]/people/page.tsx`:**

1. Add import:
```typescript
import { FamilyTree } from '@/components/FamilyTree'
```

2. Add component after the header (around line 110):
```tsx
{/* Family Tree Visualization */}
<div className="mb-8 animate-slide-up">
  <FamilyTree
    brideName={wedding.brideName}
    groomName={wedding.groomName}
    people={wedding.people}
  />
</div>
```

This gives you a visual "at a glance" view to catch missing people!

---

## What the Fixed Groups Page Has:

✅ NO onClick handlers
✅ Uses AddCoupleButton component
✅ Uses DeleteGroupButton component
✅ Uses revalidatePath (not redirect)
✅ All server actions properly separated
✅ Generate suggestions works
✅ Move up/down works
✅ Duplicate works
✅ Everything fully functional

---

## File Locations:

**Main Fix:**
- `FIXED-groups-page.txt` → Copy to `src/app/weddings/[id]/groups/page.tsx`

**Family Tree (optional):**
- Already created at `src/components/FamilyTree.tsx`
- Just add it to people page (see above)

---

That's it! Just one copy/paste and you're done. No more onClick errors! 🎉
