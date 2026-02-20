import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

// ─── Step definitions ───────────────────────────────────────────────────────
const STEP_IDS = [
  'intro',
  'bride-parents',
  'groom-parents',
  'bride-siblings',
  'groom-siblings',
  'bride-grandparents',
  'groom-grandparents',
  'extras',
  'photo-review',
  'done',
] as const

type StepId = (typeof STEP_IDS)[number]

const BRIDE_STEPS: StepId[] = ['intro', 'bride-parents', 'bride-siblings', 'bride-grandparents', 'extras', 'photo-review', 'done']
const GROOM_STEPS: StepId[] = ['intro', 'groom-parents', 'groom-siblings', 'groom-grandparents', 'extras', 'photo-review', 'done']

function getAdjacentSteps(stepId: StepId, flow?: string) {
  const steps = flow === 'bride' ? BRIDE_STEPS : flow === 'groom' ? GROOM_STEPS : [...STEP_IDS]
  const idx = steps.indexOf(stepId)
  if (idx === -1) {
    // step not in this flow (e.g. groom step while flow=bride) — fall back to full list
    const fullIdx = STEP_IDS.indexOf(stepId)
    return {
      prev: fullIdx > 0 ? STEP_IDS[fullIdx - 1] : null,
      next: fullIdx < STEP_IDS.length - 1 ? STEP_IDS[fullIdx + 1] : null,
    }
  }
  return {
    prev: idx > 0 ? steps[idx - 1] : null,
    next: idx < steps.length - 1 ? steps[idx + 1] : null,
  }
}

// ─── Server actions ──────────────────────────────────────────────────────────

function flowSuffix(flow: string | null | undefined) {
  return flow ? `&flow=${flow}` : ''
}

async function addPerson(formData: FormData) {
  'use server'
  const weddingId = formData.get('weddingId') as string
  const currentStep = (formData.get('currentStep') as string) || 'intro'
  const flow = formData.get('flow') as string | null
  const fullName = (formData.get('fullName') as string)?.trim()
  const side = formData.get('side') as string
  const relationship = formData.get('relationship') as string
  const notes = formData.get('notes') as string
  const isDivorced = formData.get('isDivorced') === 'on'

  if (!fullName) {
    redirect(`/weddings/${weddingId}/couple-form?step=${currentStep}${flowSuffix(flow)}`)
  }

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

  redirect(`/weddings/${weddingId}/couple-form?step=${currentStep}${flowSuffix(flow)}`)
}

async function generateAndReview(formData: FormData) {
  'use server'
  const weddingId = formData.get('weddingId') as string
  const flow = formData.get('flow') as string | null

  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId },
    include: { people: true },
  })
  if (!wedding) return

  // Only generate if no groups exist yet
  const existingCount = await prisma.photoGroup.count({ where: { weddingId } })
  if (existingCount === 0) {
    const maxOrder = await prisma.photoGroup.findFirst({
      where: { weddingId },
      orderBy: { orderNum: 'desc' },
      select: { orderNum: true },
    })
    let orderNum = (maxOrder?.orderNum ?? 0) + 1

    const b = wedding.brideName
    const g = wedding.groomName

    const findPeople = (side: string, relationship: string) =>
      wedding.people.filter((p) => p.side === side && p.relationship === relationship).map((p) => p.id)

    const findAllBySide = (side: string) =>
      wedding.people.filter((p) => p.side === side).map((p) => p.id)

    const templates = [
      // Bride's side
      { name: `Couple + ${b}'s Parents`,        side: 'Bride', people: ['bride', 'groom', ...findPeople('Bride', 'Mom'), ...findPeople('Bride', 'Dad')] },
      { name: `Couple + ${b}'s Mom`,             side: 'Bride', people: ['bride', 'groom', ...findPeople('Bride', 'Mom')] },
      { name: `Couple + ${b}'s Dad`,             side: 'Bride', people: ['bride', 'groom', ...findPeople('Bride', 'Dad')] },
      { name: `${b} + ${b}'s Mom`,               side: 'Bride', people: ['bride', ...findPeople('Bride', 'Mom')] },
      { name: `${b} + ${b}'s Dad`,               side: 'Bride', people: ['bride', ...findPeople('Bride', 'Dad')] },
      { name: `Couple + ${b}'s Siblings`,        side: 'Bride', people: ['bride', 'groom', ...findPeople('Bride', 'Sibling')] },
      { name: `${b} + ${b}'s Siblings`,          side: 'Bride', people: ['bride', ...findPeople('Bride', 'Sibling')] },
      { name: `Couple + ${b}'s Grandparents`,    side: 'Bride', people: ['bride', 'groom', ...findPeople('Bride', 'Grandparent')] },
      { name: `Couple + ${b}'s Extended Family`, side: 'Bride', people: ['bride', 'groom', ...findAllBySide('Bride')] },
      // Groom's side
      { name: `Couple + ${g}'s Parents`,        side: 'Groom', people: ['bride', 'groom', ...findPeople('Groom', 'Mom'), ...findPeople('Groom', 'Dad')] },
      { name: `Couple + ${g}'s Mom`,             side: 'Groom', people: ['bride', 'groom', ...findPeople('Groom', 'Mom')] },
      { name: `Couple + ${g}'s Dad`,             side: 'Groom', people: ['bride', 'groom', ...findPeople('Groom', 'Dad')] },
      { name: `${g} + ${g}'s Mom`,               side: 'Groom', people: ['groom', ...findPeople('Groom', 'Mom')] },
      { name: `${g} + ${g}'s Dad`,               side: 'Groom', people: ['groom', ...findPeople('Groom', 'Dad')] },
      { name: `Couple + ${g}'s Siblings`,        side: 'Groom', people: ['bride', 'groom', ...findPeople('Groom', 'Sibling')] },
      { name: `${g} + ${g}'s Siblings`,          side: 'Groom', people: ['groom', ...findPeople('Groom', 'Sibling')] },
      { name: `Couple + ${g}'s Grandparents`,    side: 'Groom', people: ['bride', 'groom', ...findPeople('Groom', 'Grandparent')] },
      { name: `Couple + ${g}'s Extended Family`, side: 'Groom', people: ['bride', 'groom', ...findAllBySide('Groom')] },
      // Mixed
      { name: 'Couple + Both sets of parents',   side: 'Mixed', people: ['bride', 'groom', ...findPeople('Bride', 'Mom'), ...findPeople('Bride', 'Dad'), ...findPeople('Groom', 'Mom'), ...findPeople('Groom', 'Dad')] },
      { name: 'Couple + Immediate families',     side: 'Mixed', people: ['bride', 'groom', ...findAllBySide('Bride'), ...findAllBySide('Groom')] },
    ]

    for (const template of templates) {
      // Only create if the relevant family members exist (or it's a couple-only type)
      const familyPeople = template.people.filter((id) => id !== 'bride' && id !== 'groom')
      if (familyPeople.length > 0) {
        await prisma.photoGroup.create({
          data: {
            groupName: template.name,
            side: template.side,
            priority: 'Must-have',
            orderNum: orderNum++,
            status: 'Not Ready',
            weddingId,
            people: {
              create: template.people.map((personId) => ({ personId })),
            },
          },
        })
      }
    }
  }

  redirect(`/weddings/${weddingId}/couple-form?step=photo-review${flowSuffix(flow)}`)
}

async function removeGroup(formData: FormData) {
  'use server'
  const groupId = formData.get('groupId') as string
  const weddingId = formData.get('weddingId') as string
  const flow = formData.get('flow') as string | null

  await prisma.photoGroup.delete({ where: { id: groupId } })
  redirect(`/weddings/${weddingId}/couple-form?step=photo-review${flowSuffix(flow)}`)
}

async function removePerson(formData: FormData) {
  'use server'
  const personId = formData.get('personId') as string
  const weddingId = formData.get('weddingId') as string
  const currentStep = (formData.get('currentStep') as string) || 'intro'
  const flow = formData.get('flow') as string | null

  await prisma.person.delete({ where: { id: personId } })
  redirect(`/weddings/${weddingId}/couple-form?step=${currentStep}${flowSuffix(flow)}`)
}

async function updatePersonName(formData: FormData) {
  'use server'
  const personId = formData.get('personId') as string
  const weddingId = formData.get('weddingId') as string
  const currentStep = (formData.get('currentStep') as string) || 'intro'
  const flow = formData.get('flow') as string | null
  const fullName = (formData.get('fullName') as string)?.trim()

  if (fullName) {
    await prisma.person.update({ where: { id: personId }, data: { fullName } })
  }
  redirect(`/weddings/${weddingId}/couple-form?step=${currentStep}${flowSuffix(flow)}`)
}

// ─── Shared components ───────────────────────────────────────────────────────

function ProgressDots({
  currentStep,
  brideName,
  groomName,
}: {
  currentStep: StepId
  brideName: string
  groomName: string
}) {
  if (currentStep === 'intro' || currentStep === 'done') return null

  const steps = [
    { id: 'bride-parents',      label: `${brideName}'s Parents` },
    { id: 'groom-parents',      label: `${groomName}'s Parents` },
    { id: 'bride-siblings',     label: `${brideName}'s Siblings` },
    { id: 'groom-siblings',     label: `${groomName}'s Siblings` },
    { id: 'bride-grandparents', label: `${brideName}'s Grandparents` },
    { id: 'groom-grandparents', label: `${groomName}'s Grandparents` },
    { id: 'extras',             label: 'Anyone Else?' },
    { id: 'photo-review',       label: 'Photo List' },
  ]

  const currentIdx = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="flex items-center justify-center gap-1.5 mb-8">
      {steps.map((step, i) => (
        <div
          key={step.id}
          title={step.label}
          className={`rounded-full transition-all duration-300 ${
            i < currentIdx
              ? 'w-2.5 h-2.5 bg-rose-400'
              : i === currentIdx
              ? 'w-3.5 h-3.5 bg-rose-500 ring-2 ring-rose-200'
              : 'w-2.5 h-2.5 bg-neutral-200'
          }`}
        />
      ))}
    </div>
  )
}

function PersonBadge({
  person,
  weddingId,
  currentStep,
  editingId,
  flow,
  accentInitialBg = 'bg-rose-100',
  accentInitialText = 'text-rose-600',
}: {
  person: { id: string; fullName: string; relationship: string; isDivorced?: boolean }
  weddingId: string
  currentStep: StepId
  editingId?: string
  flow?: string
  accentInitialBg?: string
  accentInitialText?: string
}) {
  const isEditing = editingId === person.id
  const fs = flow ? `&flow=${flow}` : ''

  if (isEditing) {
    return (
      <form action={updatePersonName} className="flex gap-2 items-center bg-white rounded-xl border-2 border-rose-300 px-3 py-2 shadow-sm">
        <input type="hidden" name="personId" value={person.id} />
        <input type="hidden" name="weddingId" value={weddingId} />
        <input type="hidden" name="currentStep" value={currentStep} />
        {flow && <input type="hidden" name="flow" value={flow} />}
        <div className={`w-8 h-8 rounded-full ${accentInitialBg} flex items-center justify-center ${accentInitialText} font-semibold text-sm flex-shrink-0`}>
          {person.fullName.charAt(0).toUpperCase()}
        </div>
        <input
          type="text"
          name="fullName"
          defaultValue={person.fullName}
          className="flex-1 text-sm bg-transparent border-none outline-none focus:outline-none min-w-0"
          autoFocus
        />
        <button type="submit" className="text-xs bg-rose-500 text-white px-3 py-1.5 rounded-lg font-medium flex-shrink-0 hover:bg-rose-600 transition-colors">
          Save
        </button>
        <Link
          href={`/weddings/${weddingId}/couple-form?step=${currentStep}${fs}`}
          className="text-xs text-neutral-400 hover:text-neutral-600 px-2 py-1 rounded flex-shrink-0"
        >
          Cancel
        </Link>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-3 py-2.5 px-4 bg-white rounded-xl border border-neutral-200 shadow-sm group">
      <div className={`w-8 h-8 rounded-full ${accentInitialBg} flex items-center justify-center ${accentInitialText} font-semibold text-sm flex-shrink-0`}>
        {person.fullName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 text-sm leading-tight">{person.fullName}</p>
        <p className="text-xs text-neutral-500 leading-tight">{person.relationship}</p>
      </div>
      {person.isDivorced && (
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">Divorced</span>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Link
          href={`/weddings/${weddingId}/couple-form?step=${currentStep}&editing=${person.id}${fs}`}
          className="text-xs text-neutral-400 hover:text-neutral-700 px-2 py-1 rounded transition-colors"
        >
          Edit
        </Link>
        <form action={removePerson}>
          <input type="hidden" name="personId" value={person.id} />
          <input type="hidden" name="weddingId" value={weddingId} />
          <input type="hidden" name="currentStep" value={currentStep} />
          {flow && <input type="hidden" name="flow" value={flow} />}
          <button type="submit" className="text-xs text-neutral-400 hover:text-red-500 px-2 py-1 rounded transition-colors">
            Remove
          </button>
        </form>
      </div>
    </div>
  )
}

function StepNav({
  weddingId,
  prev,
  next,
  nextLabel = 'Next →',
  flow,
}: {
  weddingId: string
  prev: StepId | null
  next: StepId | null
  nextLabel?: string
  flow?: string
}) {
  const fs = flow ? `&flow=${flow}` : ''
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-100">
      <div>
        {prev && (
          <Link href={`/weddings/${weddingId}/couple-form?step=${prev}${fs}`} className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1">
            ← Back
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        {next && (
          <>
            <Link href={`/weddings/${weddingId}/couple-form?step=${next}${fs}`} className="text-sm text-neutral-500 hover:text-neutral-700">
              Skip this step
            </Link>
            <Link
              href={`/weddings/${weddingId}/couple-form?step=${next}${fs}`}
              className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
            >
              {nextLabel}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Parent step (reusable for bride + groom) ────────────────────────────────
function ParentStep({
  side,
  sideName,
  stepLabel,
  stepNum,
  currentStep,
  prev,
  next,
  nextLabel,
  weddingId,
  editingId,
  flow,
  accentBg,
  accentBorder,
  accentFocus,
  accentBtn,
  accentText,
  accentInitialBg,
  accentInitialText,
  people,
}: {
  side: 'Bride' | 'Groom'
  sideName: string
  stepLabel: string
  stepNum: string
  currentStep: StepId
  prev: StepId | null
  next: StepId | null
  nextLabel: string
  weddingId: string
  editingId: string | undefined
  flow?: string
  accentBg: string
  accentBorder: string
  accentFocus: string
  accentBtn: string
  accentText: string
  accentInitialBg: string
  accentInitialText: string
  people: { id: string; fullName: string; relationship: string; isDivorced: boolean }[]
}) {
  const existingMom = people.find((p) => p.relationship === 'Mom')
  const existingDad = people.find((p) => p.relationship === 'Dad')
  const stepParents = people.filter((p) => p.relationship === 'Step Mom' || p.relationship === 'Step Dad')

  // An "added" tile replaces the input row for mom/dad
  function DoneTile({ person }: { person: { id: string; fullName: string; relationship: string; isDivorced: boolean } }) {
    return (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-neutral-700 mb-1.5">{person.relationship}'s full name</label>
        <PersonBadge person={person} weddingId={weddingId} currentStep={currentStep} editingId={editingId} flow={flow} accentInitialBg={accentInitialBg} accentInitialText={accentInitialText} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <p className={`${accentText} font-medium text-sm uppercase tracking-wider mb-2`}>{stepLabel} · Step {stepNum}</p>
        <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">{sideName}'s Parents</h1>
        <p className="text-neutral-600">Start by telling us who {sideName}'s parents are. Skip anyone who won't be at the wedding.</p>
      </div>

      <div className={`${accentBg} ${accentBorder} border rounded-2xl p-6 space-y-5`}>
        {/* Mom — show done tile if already added, otherwise show input */}
        {existingMom ? (
          <DoneTile person={existingMom} />
        ) : (
          <form action={addPerson} className="flex gap-3 items-end">
            <input type="hidden" name="weddingId" value={weddingId} />
            <input type="hidden" name="currentStep" value={currentStep} />
            <input type="hidden" name="side" value={side} />
            <input type="hidden" name="relationship" value="Mom" />
            {flow && <input type="hidden" name="flow" value={flow} />}
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">Mom's full name</label>
              <input type="text" name="fullName" className={`w-full px-4 py-3 rounded-xl border border-neutral-200 ${accentFocus} bg-white text-base focus:outline-none focus:ring-2`} placeholder="e.g. Patricia Smith" />
            </div>
            <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm transition-colors flex-shrink-0`}>Add</button>
          </form>
        )}

        {/* Dad — show done tile if already added, otherwise show input */}
        {existingDad ? (
          <DoneTile person={existingDad} />
        ) : (
          <form action={addPerson} className="space-y-2">
            <input type="hidden" name="weddingId" value={weddingId} />
            <input type="hidden" name="currentStep" value={currentStep} />
            <input type="hidden" name="side" value={side} />
            <input type="hidden" name="relationship" value="Dad" />
            {flow && <input type="hidden" name="flow" value={flow} />}
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Dad's full name</label>
                <input type="text" name="fullName" className={`w-full px-4 py-3 rounded-xl border border-neutral-200 ${accentFocus} bg-white text-base focus:outline-none focus:ring-2`} placeholder="e.g. Robert Smith" />
              </div>
              <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm transition-colors flex-shrink-0`}>Add</button>
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-600 pl-1">
              <input type="checkbox" name="isDivorced" className="w-4 h-4 rounded" />
              Parents are divorced (we'll plan separate shots)
            </label>
          </form>
        )}

        {/* Step parents */}
        <details className="group" open={stepParents.length > 0}>
          <summary className="text-sm font-medium text-neutral-600 cursor-pointer hover:text-neutral-900 list-none flex items-center gap-1.5 select-none">
            <span className={`${accentText} group-open:rotate-90 transition-transform inline-block`}>▶</span>
            {stepParents.length > 0 ? `Step-parents (${stepParents.length} added)` : 'Add a step-parent'}
          </summary>
          <div className="mt-4 space-y-3 pl-4 border-l-2 border-neutral-200">
            {/* Show already-added step parents */}
            {stepParents.map((p) => (
              <PersonBadge key={p.id} person={p} weddingId={weddingId} currentStep={currentStep} editingId={editingId} flow={flow} accentInitialBg={accentInitialBg} accentInitialText={accentInitialText} />
            ))}
            {/* Add more step parents */}
            {['Step Mom', 'Step Dad'].map((rel) => {
              const alreadyAdded = people.find((p) => p.relationship === rel)
              if (alreadyAdded) return null
              return (
                <form key={rel} action={addPerson} className="flex gap-3 items-end">
                  <input type="hidden" name="weddingId" value={weddingId} />
                  <input type="hidden" name="currentStep" value={currentStep} />
                  <input type="hidden" name="side" value={side} />
                  <input type="hidden" name="relationship" value={rel} />
                  {flow && <input type="hidden" name="flow" value={flow} />}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">{rel}'s name</label>
                    <input type="text" name="fullName" className={`w-full px-4 py-3 rounded-xl border border-neutral-200 ${accentFocus} bg-white text-base focus:outline-none focus:ring-2`} placeholder="Full name" />
                  </div>
                  <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                </form>
              )
            })}
          </div>
        </details>
      </div>

      <StepNav weddingId={weddingId} prev={prev} next={next} nextLabel={nextLabel} flow={flow} />
    </div>
  )
}

// ─── Sibling/Grandparent step (reusable) ────────────────────────────────────
function FamilyStep({
  side,
  sideName,
  stepLabel,
  stepNum,
  currentStep,
  prev,
  next,
  nextLabel,
  weddingId,
  editingId,
  flow,
  heading,
  description,
  primaryRelationship,
  secondaryRelationship,
  primaryPlaceholder,
  secondaryPlaceholder,
  accentBg,
  accentBorder,
  accentFocus,
  accentBtn,
  accentText,
  accentInitialBg,
  accentInitialText,
  people,
}: {
  side: 'Bride' | 'Groom'
  sideName: string
  stepLabel: string
  stepNum: string
  currentStep: StepId
  prev: StepId | null
  next: StepId | null
  nextLabel: string
  weddingId: string
  editingId: string | undefined
  flow?: string
  heading: string
  description: string
  primaryRelationship: string
  secondaryRelationship?: string
  primaryPlaceholder: string
  secondaryPlaceholder?: string
  accentBg: string
  accentBorder: string
  accentFocus: string
  accentBtn: string
  accentText: string
  accentInitialBg: string
  accentInitialText: string
  people: { id: string; fullName: string; relationship: string; isDivorced: boolean }[]
}) {
  return (
    <div>
      <div className="mb-8">
        <p className={`${accentText} font-medium text-sm uppercase tracking-wider mb-2`}>{stepLabel} · Step {stepNum}</p>
        <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">{heading}</h1>
        <p className="text-neutral-600">{description}</p>
      </div>

      <div className={`${accentBg} ${accentBorder} border rounded-2xl p-6 space-y-5`}>
        <form action={addPerson} className="flex gap-3 items-end">
          <input type="hidden" name="weddingId" value={weddingId} />
          <input type="hidden" name="currentStep" value={currentStep} />
          {flow && <input type="hidden" name="flow" value={flow} />}
          <input type="hidden" name="side" value={side} />
          <input type="hidden" name="relationship" value={primaryRelationship} />
          <div className="flex-1">
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">Full name</label>
            <input type="text" name="fullName" className={`w-full px-4 py-3 rounded-xl border border-neutral-200 ${accentFocus} bg-white text-base focus:outline-none focus:ring-2`} placeholder={primaryPlaceholder} />
          </div>
          <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
        </form>

        {secondaryRelationship && secondaryPlaceholder && (
          <form action={addPerson} className="flex gap-3 items-end">
            <input type="hidden" name="weddingId" value={weddingId} />
            <input type="hidden" name="currentStep" value={currentStep} />
            <input type="hidden" name="side" value={side} />
            <input type="hidden" name="relationship" value={secondaryRelationship} />
            {flow && <input type="hidden" name="flow" value={flow} />}
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                {secondaryRelationship} <span className="text-neutral-400 font-normal">(optional)</span>
              </label>
              <input type="text" name="fullName" className={`w-full px-4 py-3 rounded-xl border border-neutral-200 ${accentFocus} bg-white text-base focus:outline-none focus:ring-2`} placeholder={secondaryPlaceholder} />
            </div>
            <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
          </form>
        )}
      </div>

      {people.length > 0 && (
        <div className="mt-6">
          <p className="text-sm font-medium text-neutral-500 mb-3">Added so far:</p>
          <div className="space-y-2">
            {people.map((p) => (
              <PersonBadge
                key={p.id}
                person={p}
                weddingId={weddingId}
                currentStep={currentStep}
                editingId={editingId}
                flow={flow}
                accentInitialBg={accentInitialBg}
                accentInitialText={accentInitialText}
              />
            ))}
          </div>
        </div>
      )}

      <StepNav weddingId={weddingId} prev={prev} next={next} nextLabel={nextLabel} flow={flow} />
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function CoupleFormPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { step?: string; editing?: string; flow?: string }
}) {
  const wedding = await prisma.wedding.findUnique({
    where: { id: params.id },
    include: {
      people: { orderBy: [{ relationship: 'asc' }, { fullName: 'asc' }] },
      photoGroups: {
        include: { people: true },
        orderBy: { orderNum: 'asc' },
      },
    },
  })

  if (!wedding) notFound()

  const rawStep = searchParams.step ?? 'intro'
  const currentStep: StepId = (STEP_IDS as readonly string[]).includes(rawStep)
    ? (rawStep as StepId)
    : 'intro'

  const editingId = searchParams.editing as string | undefined
  const flow = searchParams.flow as string | undefined
  const { prev, next } = getAdjacentSteps(currentStep, flow)

  const byCategory = (side: 'Bride' | 'Groom', ...rels: string[]) =>
    wedding.people.filter((p) => p.side === side && rels.includes(p.relationship))

  const { brideName, groomName } = wedding

  // Styling per side
  const brideStyles = {
    accentBg: 'bg-rose-50',
    accentBorder: 'border-rose-100',
    accentFocus: 'focus:ring-rose-400',
    accentBtn: 'bg-rose-500 hover:bg-rose-600',
    accentText: 'text-rose-600',
    accentInitialBg: 'bg-rose-100',
    accentInitialText: 'text-rose-600',
  }
  const groomStyles = {
    accentBg: 'bg-sky-50',
    accentBorder: 'border-sky-100',
    accentFocus: 'focus:ring-sky-400',
    accentBtn: 'bg-sky-600 hover:bg-sky-700',
    accentText: 'text-sky-600',
    accentInitialBg: 'bg-sky-100',
    accentInitialText: 'text-sky-600',
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Top bar */}
      <div className="border-b border-neutral-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <p className="font-display text-lg text-neutral-800">{brideName} & {groomName}</p>
          {wedding.weddingDate && (
            <p className="text-sm text-neutral-500">
              {new Date(wedding.weddingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <ProgressDots currentStep={currentStep} brideName={brideName} groomName={groomName} />

        {/* ── INTRO ─────────────────────────────────────────────────────── */}
        {currentStep === 'intro' && (
          <div className="text-center">
            <div className="text-5xl mb-6">💐</div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-neutral-900 mb-3">Let's Build Your Photo List</h1>
            <p className="text-xl text-neutral-600 mb-2">{brideName} & {groomName}</p>
            {wedding.weddingDate && (
              <p className="text-neutral-500 mb-8">
                {new Date(wedding.weddingDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            )}
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 mb-8 text-left">
              <h2 className="font-semibold text-neutral-900 mb-3">Here's how this works 👋</h2>
              <ul className="space-y-2 text-neutral-700">
                <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">✦</span>We'll walk you through each part of your family, one step at a time.</li>
                <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">✦</span>You can skip any section that doesn't apply.</li>
                <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">✦</span>At the end, we'll build your photo list together so you can review it.</li>
                <li className="flex items-start gap-2"><span className="text-rose-400 mt-0.5">✦</span>Takes about 5 minutes — your photographer handles the rest!</li>
              </ul>
            </div>

            {/* Side-selection cards */}
            <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">Who's filling this out?</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-6">
              <Link
                href={`/weddings/${wedding.id}/couple-form?step=bride-parents`}
                className="group relative flex flex-col items-center gap-3 p-6 bg-rose-50 hover:bg-rose-100 border-2 border-rose-200 hover:border-rose-400 rounded-2xl transition-all text-left"
              >
                <div className="w-12 h-12 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 font-bold text-lg flex-shrink-0">
                  {brideName.charAt(0).toUpperCase()}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-neutral-900 text-base">{brideName}</p>
                  <p className="text-sm text-neutral-600 mt-0.5">Add {brideName}'s family</p>
                </div>
                <svg className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform mt-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link
                href={`/weddings/${wedding.id}/couple-form?step=groom-parents`}
                className="group relative flex flex-col items-center gap-3 p-6 bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 hover:border-sky-400 rounded-2xl transition-all text-left"
              >
                <div className="w-12 h-12 rounded-full bg-sky-200 flex items-center justify-center text-sky-700 font-bold text-lg flex-shrink-0">
                  {groomName.charAt(0).toUpperCase()}
                </div>
                <div className="text-center">
                  <p className="font-semibold text-neutral-900 text-base">{groomName}</p>
                  <p className="text-sm text-neutral-600 mt-0.5">Add {groomName}'s family</p>
                </div>
                <svg className="w-4 h-4 text-sky-400 group-hover:translate-x-1 transition-transform mt-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>

            <p className="text-xs text-neutral-400 mb-2">— or —</p>
            <Link href={`/weddings/${wedding.id}/couple-form?step=bride-parents`} className="inline-flex items-center gap-2 text-neutral-500 hover:text-neutral-800 text-sm transition-colors">
              Walk through everything together →
            </Link>
          </div>
        )}

        {/* ── BRIDE PARENTS ─────────────────────────────────────────────── */}
        {currentStep === 'bride-parents' && (
          <ParentStep
            side="Bride" sideName={brideName}
            stepLabel={`${brideName}'s Family`} stepNum="1 of 7"
            currentStep={currentStep} prev={prev} next={next}
            nextLabel={`Next: ${groomName}'s Parents →`}
            weddingId={wedding.id} editingId={editingId} flow={flow}
            people={byCategory('Bride', 'Mom', 'Dad', 'Step Mom', 'Step Dad')}
            {...brideStyles}
          />
        )}

        {/* ── GROOM PARENTS ─────────────────────────────────────────────── */}
        {currentStep === 'groom-parents' && (
          <ParentStep
            side="Groom" sideName={groomName}
            stepLabel={`${groomName}'s Family`} stepNum="2 of 7"
            currentStep={currentStep} prev={prev} next={next}
            nextLabel={`Next: ${brideName}'s Siblings →`}
            weddingId={wedding.id} editingId={editingId} flow={flow}
            people={byCategory('Groom', 'Mom', 'Dad', 'Step Mom', 'Step Dad')}
            {...groomStyles}
          />
        )}

        {/* ── BRIDE SIBLINGS ────────────────────────────────────────────── */}
        {currentStep === 'bride-siblings' && (
          <FamilyStep
            side="Bride" sideName={brideName}
            stepLabel={`${brideName}'s Family`} stepNum="3 of 7"
            currentStep={currentStep} prev={prev} next={next}
            nextLabel={`Next: ${groomName}'s Siblings →`}
            weddingId={wedding.id} editingId={editingId} flow={flow}
            heading={`${brideName}'s Siblings`}
            description={`Add ${brideName}'s brothers and sisters, and their partners if they'll be in photos.`}
            primaryRelationship="Sibling"
            primaryPlaceholder="e.g. Emily Smith"
            secondaryRelationship="Sibling Spouse/Partner"
            secondaryPlaceholder="e.g. Tom Williams (Emily's partner)"
            people={byCategory('Bride', 'Sibling', 'Sibling Spouse/Partner')}
            {...brideStyles}
          />
        )}

        {/* ── GROOM SIBLINGS ────────────────────────────────────────────── */}
        {currentStep === 'groom-siblings' && (
          <FamilyStep
            side="Groom" sideName={groomName}
            stepLabel={`${groomName}'s Family`} stepNum="4 of 7"
            currentStep={currentStep} prev={prev} next={next}
            nextLabel={`Next: ${brideName}'s Grandparents →`}
            weddingId={wedding.id} editingId={editingId} flow={flow}
            heading={`${groomName}'s Siblings`}
            description={`Add ${groomName}'s brothers and sisters, and their partners if they'll be in photos.`}
            primaryRelationship="Sibling"
            primaryPlaceholder="e.g. Michael Johnson"
            secondaryRelationship="Sibling Spouse/Partner"
            secondaryPlaceholder="e.g. Sarah Johnson (Michael's partner)"
            people={byCategory('Groom', 'Sibling', 'Sibling Spouse/Partner')}
            {...groomStyles}
          />
        )}

        {/* ── BRIDE GRANDPARENTS ────────────────────────────────────────── */}
        {currentStep === 'bride-grandparents' && (
          <FamilyStep
            side="Bride" sideName={brideName}
            stepLabel={`${brideName}'s Family`} stepNum="5 of 7"
            currentStep={currentStep} prev={prev} next={next}
            nextLabel={`Next: ${groomName}'s Grandparents →`}
            weddingId={wedding.id} editingId={editingId} flow={flow}
            heading={`${brideName}'s Grandparents`}
            description="Will any grandparents be there? Add them so we make sure they're included."
            primaryRelationship="Grandparent"
            primaryPlaceholder="e.g. Dorothy Smith"
            people={byCategory('Bride', 'Grandparent')}
            {...brideStyles}
          />
        )}

        {/* ── GROOM GRANDPARENTS ────────────────────────────────────────── */}
        {currentStep === 'groom-grandparents' && (
          <FamilyStep
            side="Groom" sideName={groomName}
            stepLabel={`${groomName}'s Family`} stepNum="6 of 7"
            currentStep={currentStep} prev={prev} next={next}
            nextLabel="Next: Anyone Else? →"
            weddingId={wedding.id} editingId={editingId} flow={flow}
            heading={`${groomName}'s Grandparents`}
            description={`Will any of ${groomName}'s grandparents be at the wedding?`}
            primaryRelationship="Grandparent"
            primaryPlaceholder="e.g. Harold Johnson"
            people={byCategory('Groom', 'Grandparent')}
            {...groomStyles}
          />
        )}

        {/* ── EXTRAS ────────────────────────────────────────────────────── */}
        {currentStep === 'extras' && (() => {
          const EXTRA_RELS = ['Aunt/Uncle', 'Cousin', 'Friend', 'Other']
          const brideSide = wedding.people.filter((p) => p.side === 'Bride')
          const groomSide = wedding.people.filter((p) => p.side === 'Groom')

          return (
            <div>
              <div className="mb-8">
                <p className="text-neutral-500 font-medium text-sm uppercase tracking-wider mb-2">Almost done · Step 7 of 7</p>
                <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">Anyone Else?</h1>
                <p className="text-neutral-600">Aunts, uncles, cousins, close friends — anyone else who should be in family photos.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { label: `${brideName}'s Side`, side: 'Bride', people: brideSide, bg: 'bg-rose-50', border: 'border-rose-100', focus: 'focus:ring-rose-400', btn: 'bg-rose-500 hover:bg-rose-600', text: 'text-rose-700' },
                  { label: `${groomName}'s Side`, side: 'Groom', people: groomSide, bg: 'bg-sky-50', border: 'border-sky-100', focus: 'focus:ring-sky-400', btn: 'bg-sky-600 hover:bg-sky-700', text: 'text-sky-700' },
                ].map(({ label, side, people, bg, border, focus, btn, text }) => (
                  <div key={side} className={`${bg} ${border} border rounded-2xl p-5`}>
                    <h3 className={`font-semibold ${text} mb-4`}>{label}</h3>
                    <form action={addPerson} className="space-y-3">
                      <input type="hidden" name="weddingId" value={wedding.id} />
                      <input type="hidden" name="currentStep" value={currentStep} />
                      <input type="hidden" name="side" value={side} />
                      {flow && <input type="hidden" name="flow" value={flow} />}
                      <input type="text" name="fullName" className={`w-full px-3 py-2.5 rounded-xl border border-neutral-200 ${focus} bg-white text-sm focus:outline-none focus:ring-2`} placeholder="Full name" />
                      <select name="relationship" required className={`w-full px-3 py-2.5 rounded-xl border border-neutral-200 ${focus} bg-white text-sm focus:outline-none focus:ring-2`}>
                        <option value="">Relationship...</option>
                        {EXTRA_RELS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <button type="submit" className={`w-full ${btn} text-white py-2.5 rounded-xl text-sm font-medium transition-colors`}>+ Add to {side === 'Bride' ? brideName : groomName}'s side</button>
                    </form>
                    {people.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {people.map((p) => (
                          <PersonBadge
                            key={p.id}
                            person={p}
                            weddingId={wedding.id}
                            currentStep={currentStep}
                            editingId={editingId}
                            flow={flow}
                            accentInitialBg={side === 'Bride' ? 'bg-rose-100' : 'bg-sky-100'}
                            accentInitialText={side === 'Bride' ? 'text-rose-600' : 'text-sky-600'}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-neutral-100">
                <Link href={`/weddings/${wedding.id}/couple-form?step=${prev}${flow ? `&flow=${flow}` : ''}`} className="text-sm text-neutral-500 hover:text-neutral-700">← Back</Link>
                <form action={generateAndReview}>
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  {flow && <input type="hidden" name="flow" value={flow} />}
                  <button type="submit" className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm">
                    Build Our Photo List →
                  </button>
                </form>
              </div>
            </div>
          )
        })()}

        {/* ── PHOTO REVIEW ──────────────────────────────────────────────── */}
        {currentStep === 'photo-review' && (() => {
          const brideGroups = wedding.photoGroups.filter((g) => g.side === 'Bride')
          const groomGroups = wedding.photoGroups.filter((g) => g.side === 'Groom')
          const mixedGroups = wedding.photoGroups.filter((g) => g.side === 'Mixed')

          const renderGroup = (group: typeof wedding.photoGroups[0]) => {
            const people = group.people.map((p) => {
              if (p.personId === 'bride') return brideName
              if (p.personId === 'groom') return groomName
              return wedding.people.find(person => person.id === p.personId)?.fullName ?? '?'
            })
            return (
              <div key={group.id} className="flex items-start gap-3 bg-white border border-neutral-200 rounded-xl px-4 py-3 hover:border-neutral-300 transition-colors group">
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="font-medium text-neutral-900 text-sm">{group.groupName}</p>
                  {people.length > 0 && (
                    <p className="text-xs text-neutral-500 mt-0.5 truncate">{people.join(', ')}</p>
                  )}
                </div>
                <form action={removeGroup}>
                  <input type="hidden" name="groupId" value={group.id} />
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  {flow && <input type="hidden" name="flow" value={flow} />}
                  <button type="submit" className="opacity-0 group-hover:opacity-100 text-xs text-neutral-400 hover:text-red-500 transition-all px-2 py-1 rounded flex-shrink-0 mt-0.5">
                    Remove
                  </button>
                </form>
              </div>
            )
          }

          const renderSection = (title: string, groups: typeof wedding.photoGroups, dot: string) => {
            if (groups.length === 0) return null
            return (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${dot}`} />
                  <h3 className="font-semibold text-neutral-700 text-sm">{title}</h3>
                  <span className="text-xs text-neutral-400">{groups.length} shots</span>
                </div>
                <div className="space-y-2">{groups.map(renderGroup)}</div>
              </div>
            )
          }

          return (
            <div>
              <div className="mb-8 text-center">
                <div className="text-4xl mb-4">📷</div>
                <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">Your Photo List</h1>
                <p className="text-neutral-600 max-w-md mx-auto">
                  We've put together shots based on your family. Remove anything that doesn't feel right — your photographer will help you finalize the rest.
                </p>
              </div>

              <div className="bg-white border border-neutral-200 rounded-2xl p-6 mb-6">
                {renderSection(`${brideName}'s Family`, brideGroups, 'bg-rose-400')}
                {renderSection(`${groomName}'s Family`, groomGroups, 'bg-sky-400')}
                {renderSection('Together', mixedGroups, 'bg-purple-400')}
                {wedding.photoGroups.length === 0 && (
                  <p className="text-neutral-500 text-center py-4">No photo groups yet. Go back and add your family first.</p>
                )}
              </div>

              <div className="text-center text-xs text-neutral-400 mb-6">
                Hover over any shot to remove it · Your photographer may add more
              </div>

              <div className="flex items-center justify-between">
                <Link href={`/weddings/${wedding.id}/couple-form?step=extras${flow ? `&flow=${flow}` : ''}`} className="text-sm text-neutral-500 hover:text-neutral-700">← Back</Link>
                <Link href={`/weddings/${wedding.id}/couple-form?step=done${flow ? `&flow=${flow}` : ''}`} className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm">
                  Looks Great! →
                </Link>
              </div>
            </div>
          )
        })()}

        {/* ── DONE ──────────────────────────────────────────────────────── */}
        {currentStep === 'done' && (() => {
          const brideSide = wedding.people.filter((p) => p.side === 'Bride')
          const groomSide = wedding.people.filter((p) => p.side === 'Groom')

          const groupByRel = (people: typeof wedding.people) => {
            const order = ['Mom', 'Dad', 'Step Mom', 'Step Dad', 'Sibling', 'Sibling Spouse/Partner', 'Grandparent', 'Aunt/Uncle', 'Cousin', 'Friend', 'Other']
            const grouped: Record<string, typeof people> = {}
            for (const p of people) {
              if (!grouped[p.relationship]) grouped[p.relationship] = []
              grouped[p.relationship].push(p)
            }
            return order.filter((r) => grouped[r]).map((r) => ({ relationship: r, people: grouped[r] }))
          }

          return (
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-neutral-900 mb-3">You're all set!</h1>
              <p className="text-lg text-neutral-600 mb-8">
                Your photographer will use this to make sure every important person gets the perfect shot.
              </p>

              {wedding.people.length > 0 && (
                <div className="text-left mb-10">
                  <h2 className="font-display text-2xl font-semibold text-neutral-800 mb-6 text-center">
                    Your Family List ({wedding.people.length} people)
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    {[
                      { name: brideName, side: brideSide, bg: 'bg-rose-50', text: 'text-rose-600', itemBg: 'bg-rose-50/50' },
                      { name: groomName, side: groomSide, bg: 'bg-sky-50', text: 'text-sky-600', itemBg: 'bg-sky-50/50' },
                    ].map(({ name, side, bg, text, itemBg }) => (
                      <div key={name}>
                        <h3 className={`font-semibold ${text} mb-3 text-center ${bg} rounded-xl py-2`}>
                          {name}'s Family · {side.length}
                        </h3>
                        {groupByRel(side).map(({ relationship, people }) => (
                          <div key={relationship} className="mb-3">
                            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1 px-1">{relationship}</p>
                            {people.map((p) => (
                              <div key={p.id} className={`text-sm text-neutral-800 py-1.5 px-3 ${itemBg} rounded-lg mb-1`}>
                                {p.fullName}
                                {p.isDivorced && <span className="text-xs text-amber-600 ml-2">divorced</span>}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-stone-50 border border-neutral-200 rounded-2xl p-6 text-left mb-6">
                <p className="text-neutral-700 mb-2">
                  ✨ <strong>Need to make changes?</strong> Bookmark this page — you can come back anytime before the wedding.
                </p>
                <p className="text-sm text-neutral-500">Questions? Don't hesitate to reach out to your photographer directly.</p>
              </div>

              <Link href={`/weddings/${wedding.id}/couple-form?step=photo-review${flow ? `&flow=${flow}` : ''}`} className="text-sm text-neutral-500 hover:text-neutral-700">
                ← Review photo list
              </Link>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
