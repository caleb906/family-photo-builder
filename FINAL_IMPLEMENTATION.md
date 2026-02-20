# FINAL FIXES - Complete Implementation Guide

## 🎯 What's Been Added

### ✅ New Components Created
1. **SearchableRelationship.tsx** - Type to search or select from dropdown
2. **EditPersonButton.tsx** - Modal popup to edit person details
3. **autoGroups.ts** - Smart auto-generation of photo groups

### 🚀 Features to Implement

## STEP 1: Fix Groups Page onClick Error

The groups page at `/src/app/weddings/[id]/groups/page.tsx` needs these changes:

### Change 1: Update Imports (Line 1-5)
```typescript
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AddCoupleButton } from '@/components/AddCoupleButton'
import { DeleteGroupButton } from '@/components/DeleteGroupButton'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'
```

### Change 2: Fix AddGroup Function
Replace the `redirect` at the end with `revalidatePath`:
```typescript
async function addGroup(formData: FormData) {
  'use server'
  // ... existing code ...
  
  revalidatePath(`/weddings/${weddingId}/groups`)
}
```

### Change 3: Fix DeleteGroup Function  
```typescript
async function deleteGroup(formData: FormData) {
  'use server'
  const groupId = formData.get('groupId') as string
  
  await prisma.photoGroup.delete({
    where: { id: groupId },
  })
  
  // No redirect needed
}
```

### Change 4: Replace Add Couple Button (Line ~343)
Find the `<button type="button" ... onClick...>` and replace with:
```tsx
<AddCoupleButton />
```

### Change 5: Replace Delete Button (Line ~540)
Find the entire `<form action={deleteGroup}...>` with onClick and replace with:
```tsx
<DeleteGroupButton
  groupId={group.id}
  weddingId={wedding.id}
  deleteAction={deleteGroup}
/>
```

---

## STEP 2: Add Searchable Relationship to Couple Form

In `/src/app/weddings/[id]/couple-form/page.tsx`:

### Add Import:
```typescript
import { SearchableRelationship } from '@/components/SearchableRelationship'
```

### Replace the relationship dropdown (Line ~135):
```tsx
<div>
  <label htmlFor="relationship" className="label text-base">Relationship *</label>
  <SearchableRelationship name="relationship" />
</div>
```

---

## STEP 3: Add Edit/Delete to Couple Form

In `/src/app/weddings/[id]/couple-form/page.tsx`:

### Add Imports:
```typescript
import { EditPersonButton } from '@/components/EditPersonButton'
import { DeletePersonButton } from '@/components/DeletePersonButton'
```

### Add Server Actions (after addPerson):
```typescript
async function updatePerson(formData: FormData) {
  'use server'
  const personId = formData.get('personId') as string
  const weddingId = formData.get('weddingId') as string
  const fullName = formData.get('fullName') as string
  const relationship = formData.get('relationship') as string
  const notes = formData.get('notes') as string
  const isDivorced = formData.get('isDivorced') === 'on'
  
  await prisma.person.update({
    where: { id: personId },
    data: {
      fullName,
      relationship,
      notes: notes || null,
      isDivorced,
    },
  })
  
  revalidatePath(`/weddings/${weddingId}/couple-form`)
}

async function deletePerson(formData: FormData) {
  'use server'
  const personId = formData.get('personId') as string
  
  await prisma.person.delete({
    where: { id: personId },
  })
}
```

### Add Edit/Delete Buttons to Person Cards (Line ~225 for bride, ~260 for groom):

Inside each person card, after the content, add:
```tsx
<div className="flex gap-2 mt-3 pt-3 border-t border-neutral-200">
  <EditPersonButton
    person={person}
    updateAction={updatePerson}
  />
  <DeletePersonButton
    personId={person.id}
    weddingId={wedding.id}
    personName={person.fullName}
    deleteAction={deletePerson}
  />
</div>
```

---

## STEP 4: Add Auto-Group Generation

In `/src/app/weddings/[id]/couple-form/page.tsx`:

### Add Import:
```typescript
import { generateSmartGroups } from '@/lib/autoGroups'
```

### Modify addPerson Function:
```typescript
async function addPerson(formData: FormData) {
  'use server'
  const weddingId = formData.get('weddingId') as string
  const fullName = formData.get('fullName') as string
  const side = formData.get('side') as string
  const relationship = formData.get('relationship') as string
  const notes = formData.get('notes') as string
  const isDivorced = formData.get('isDivorced') === 'on'
  
  await prisma.person.create({
    data: {
      fullName,
      side,
      relationship,
      notes: notes || null,
      isDivorced,
      weddingId,
    },
  })
  
  // AUTO-GENERATE GROUPS
  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId },
    include: { people: true, photoGroups: true }
  })
  
  if (wedding) {
    // Delete old auto-generated groups
    await prisma.photoGroup.deleteMany({
      where: {
        weddingId,
        notes: 'auto-generated'
      }
    })
    
    // Generate new smart groups
    const smartGroups = generateSmartGroups(wedding, wedding.people)
    
    // Create them in database
    let orderNum = (wedding.photoGroups.length || 0) + 1
    for (const group of smartGroups) {
      await prisma.photoGroup.create({
        data: {
          groupName: group.name,
          side: group.side,
          priority: group.priority,
          orderNum: orderNum++,
          notes: 'auto-generated',
          weddingId,
          people: {
            create: group.peopleIds.map(pid => ({
              personId: pid
            }))
          }
        }
      })
    }
  }
  
  revalidatePath(`/weddings/${weddingId}/couple-form`)
}
```

---

## STEP 5: Same Searchable Dropdown for Photographer

In `/src/app/weddings/[id]/people/page.tsx`:

### Add Import:
```typescript
import { SearchableRelationship } from '@/components/SearchableRelationship'
```

### Replace relationship dropdown (Line ~155):
```tsx
<div>
  <label htmlFor="relationship" className="label">Relationship *</label>
  <SearchableRelationship name="relationship" />
</div>
```

---

## 🎨 UI Consistency

The components already match your design:
- ✅ Same color scheme (primary oranges, neutral grays)
- ✅ Same button styles
- ✅ Same card styling
- ✅ Same animations
- ✅ Mobile-responsive

---

## 🧪 Testing Checklist

1. [ ] Groups page loads without onClick errors
2. [ ] Can add couple with one click in groups
3. [ ] Can delete groups with confirmation
4. [ ] Couple form has searchable relationship dropdown
5. [ ] Can edit people on couple form
6. [ ] Can delete people on couple form
7. [ ] Auto-generates smart groups when people added
8. [ ] Groups update intelligently (parents, grandparents, siblings)
9. [ ] Photographer page also has searchable dropdown
10. [ ] All UI matches across photographer/couple views

---

## 📦 What Gets Auto-Generated

When couple adds people, system automatically creates:

**For Parents:**
- Couple + Bride's Parents
- Couple + Groom's Parents
- Couple + Both Parents
- Bride + Bride's Mom
- Bride + Bride's Dad
- Groom + Groom's Mom  
- Groom + Groom's Dad

**For Grandparents:**
- Couple + Bride's Grandparents
- Couple + Groom's Grandparents
- Couple + All Grandparents
- Individual shots with each grandparent set

**For Siblings:**
- Couple + Bride's Siblings
- Couple + Groom's Siblings
- Couple + All Siblings
- Individual with each sibling group

**Plus:**
- Parents + Grandparents combos
- Extended family groups
- "Everyone" group

All marked as "auto-generated" in notes so you know they're automatic!

---

## 🎉 Result

Couples can now:
- ✅ Add/edit/delete their own people
- ✅ Search or select relationships
- ✅ See smart photo groups auto-generated
- ✅ Use same beautiful UI as photographer

Photographers get:
- ✅ Pre-built shot lists from couples
- ✅ Searchable relationship dropdown
- ✅ Ability to refine/edit everything
- ✅ No more onClick errors!
