# Family Photo Builder

A clean, simple web app for wedding photographers to create organized family photo shot lists.

## Features

### 1. Wedding Management
- Create weddings with bride/groom names, date, and notes
- Dashboard with quick stats and navigation

### 2. People Management
- Add family members and friends
- Categorize by Bride's Side or Groom's Side
- Track relationships (Mom, Dad, Siblings, etc.)
- Mark divorced parents for special handling
- Fast entry with streamlined form

### 3. Photo Group Builder
- Create photo groupings with multi-select
- Quick "Add Couple" button
- Duplicate groups for variations
- Reorder groups with up/down buttons
- Auto-generate suggested groups based on family structure
- Side tags: Bride / Groom / Mixed
- Priority: Must-have / Nice-to-have
- Warning when bride/groom not included

### 4. Shot List (Day-of Use)
- Clean, organized list sorted by order
- Progress tracking with completion percentage
- Big status buttons: Not Ready → Ready → Shot
- Color-coded for quick visual reference
- Mobile-friendly for wedding day use

### 5. Print Version
- Clean printable layout
- Checkboxes for manual tracking
- Page breaks every 8 groups
- Professional formatting

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma + SQLite
- **Fonts**: Crimson Pro + DM Sans

## Installation & Setup

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Database

Initialize the database and run migrations:

```bash
npx prisma db push
```

This will:
- Create the SQLite database file at `prisma/dev.db`
- Set up all tables (Wedding, Person, PhotoGroup, PhotoGroupPerson)

### Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Wedding
- id, brideName, groomName, weddingDate, notes
- Relations: people, photoGroups

### Person
- id, fullName, side (Bride/Groom), relationship, notes, isDivorced
- Relations: wedding, photoGroups (many-to-many)

### PhotoGroup
- id, groupName, side, priority, orderNum, notes, status
- Relations: wedding, people (many-to-many)

### PhotoGroupPerson
- Junction table for many-to-many relationship between PhotoGroup and Person

## Usage Guide

### Creating a Wedding

1. Click "Create New Wedding"
2. Enter bride and groom names (required)
3. Optionally add wedding date and notes
4. Submit to go to wedding dashboard

### Adding People

1. Navigate to "People" from wedding dashboard
2. Fill in: Full Name, Side, Relationship
3. Optionally add notes or mark divorced status
4. Click "Add Person"
5. Repeat for all family members

### Building Photo Groups

1. Navigate to "Photo Groups"
2. **Manual Method**:
   - Enter group name
   - Select people from list
   - Use "Add Couple" for quick selection
   - Choose side and priority
   - Add optional notes

3. **Auto-Generate Method**:
   - Click "Generate Suggested Groups"
   - System creates common groupings:
     - Couple + Parents (each side)
     - Couple + Siblings (each side)
     - Individual + Parents
     - Extended family groups
   - Edit or delete as needed

4. **Management**:
   - Use ↑ ↓ buttons to reorder
   - Duplicate groups for variations
   - Delete unwanted groups

### Wedding Day Shot List

1. Navigate to "Shot List"
2. View ordered list of all groups
3. Click status buttons as you work:
   - **Not Ready**: Group not assembled yet
   - **Ready**: People gathered and ready
   - **Shot**: Photo completed ✓
4. Track progress with visual percentage bar
5. Color coding helps quick identification

### Printing

1. Navigate to "Print Version" or click Print from Shot List
2. Browser print dialog opens
3. Recommendations:
   - Print in portrait mode
   - Use actual size (100%)
   - Print background colors for badges
4. Check boxes manually during wedding

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push database schema changes
npm run db:studio    # Open Prisma Studio (database GUI)
```

## Prisma Studio

To view and edit database directly:

```bash
npm run db:studio
```

Opens GUI at [http://localhost:5555](http://localhost:5555)

## Project Structure

```
family-photo-builder/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── page.tsx           # Home (wedding list)
│   │   ├── layout.tsx         # Root layout
│   │   ├── globals.css        # Global styles
│   │   └── weddings/
│   │       ├── new/
│   │       │   └── page.tsx   # Create wedding
│   │       └── [id]/
│   │           ├── page.tsx   # Wedding dashboard
│   │           ├── people/
│   │           │   └── page.tsx
│   │           ├── groups/
│   │           │   └── page.tsx
│   │           ├── shotlist/
│   │           │   └── page.tsx
│   │           └── print/
│   │               └── page.tsx
│   └── lib/
│       └── prisma.ts          # Prisma client
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## Design Philosophy

- **Minimal clicks**: Fast data entry with streamlined forms
- **Idiot-proof**: Clear labels, visual feedback, confirmations
- **Mobile-friendly**: Large touch targets, readable on phone
- **Photographer-focused**: Non-technical interface
- **Wedding day ready**: Status tracking, print support

## Tips for Photographers

1. **Pre-Wedding**:
   - Add all people the week before
   - Use "Generate Suggestions" as starting point
   - Customize groups based on family dynamics
   - Print backup copy

2. **Wedding Day**:
   - Use tablet or phone for live updates
   - Mark groups as "Ready" when people gathered
   - Mark "Shot" immediately after taking photo
   - Check progress bar between groups

3. **Divorced Parents**:
   - Mark individuals as divorced in People section
   - Create separate photo groups
   - Add notes about timing/separation needs

4. **Complex Families**:
   - Use "Notes" field extensively
   - Create extra "Nice-to-have" groups for variations
   - Duplicate and modify existing groups

## Troubleshooting

**Database won't initialize**:
```bash
rm -rf prisma/dev.db
npx prisma db push
```

**Port 3000 already in use**:
```bash
npm run dev -- -p 3001
```

**Changes not reflecting**:
- Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Clear browser cache
- Restart dev server

**Prisma errors after schema change**:
```bash
npx prisma generate
npx prisma db push
```

## License

MIT

## Support

For issues or questions, please check the documentation or create an issue in the repository.
