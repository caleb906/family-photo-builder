# Quick Fix Instructions

## The Problem
The onClick handlers in server components cause errors. All interactive elements need to be client components.

## What's Already Fixed
- DeleteWeddingButton ✓
- DeletePersonButton ✓
- DeleteGroupButton ✓
- AddCoupleButton ✓
- CopyLinkButton ✓

## What Still Needs Fixing
The groups page at: `src/app/weddings/[id]/groups/page.tsx`

## How to Fix Groups Page

1. Add imports at top:
```typescript
import { AddCoupleButton } from '@/components/AddCoupleButton'
import { DeleteGroupButton } from '@/components/DeleteGroupButton'
```

2. Find line ~343 (the Add Couple button section) and replace with:
```tsx
<div className="flex gap-2 mb-3">
  <AddCoupleButton />
</div>
```

3. Find line ~540 (the delete form/button section) and replace with:
```tsx
<DeleteGroupButton
  groupId={group.id}
  weddingId={wedding.id}
  deleteAction={deleteGroup}
/>
```

## Test
1. `npm run dev`
2. Create wedding
3. Add people  
4. Create groups - the "Add Couple" button should work
5. Delete should show confirmation and work

All components use `useTransition` and `router.refresh()` for smooth updates.
