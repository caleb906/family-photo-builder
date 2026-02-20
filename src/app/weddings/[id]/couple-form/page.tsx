import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
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
  'done',
] as const

type StepId = (typeof STEP_IDS)[number]

function getAdjacentSteps(stepId: StepId) {
  const idx = STEP_IDS.indexOf(stepId)
  return {
    prev: idx > 0 ? STEP_IDS[idx - 1] : null,
    next: idx < STEP_IDS.length - 1 ? STEP_IDS[idx + 1] : null,
    index: idx,
    total: STEP_IDS.length - 2, // exclude intro + done from progress count
    progressIndex: Math.max(0, idx - 1), // 0-based among the real steps
  }
}

// ─── Server actions ──────────────────────────────────────────────────────────
async function addPerson(formData: FormData) {
  'use server'
  const weddingId = formData.get('weddingId') as string
  const fullName = (formData.get('fullName') as string)?.trim()
  const side = formData.get('side') as string
  const relationship = formData.get('relationship') as string
  const notes = formData.get('notes') as string
  const isDivorced = formData.get('isDivorced') === 'on'

  if (!fullName) return

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

  revalidatePath(`/weddings/${weddingId}/couple-form`)
}

// ─── Sub-components ─────────────────────────────────────────────────────────

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
    { id: 'bride-parents', label: `${brideName}'s Parents` },
    { id: 'groom-parents', label: `${groomName}'s Parents` },
    { id: 'bride-siblings', label: `${brideName}'s Siblings` },
    { id: 'groom-siblings', label: `${groomName}'s Siblings` },
    { id: 'bride-grandparents', label: `${brideName}'s Grandparents` },
    { id: 'groom-grandparents', label: `${groomName}'s Grandparents` },
    { id: 'extras', label: 'Anyone Else?' },
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
  name,
  relationship,
  isDivorced,
}: {
  name: string
  relationship: string
  isDivorced?: boolean
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-4 bg-white rounded-xl border border-neutral-200 shadow-sm">
      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-semibold text-sm flex-shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 text-sm leading-tight">{name}</p>
        <p className="text-xs text-neutral-500 leading-tight">{relationship}</p>
      </div>
      {isDivorced && (
        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex-shrink-0">
          Divorced
        </span>
      )}
    </div>
  )
}

function StepNav({
  weddingId,
  prev,
  next,
  nextLabel = 'Next →',
  skipLabel = 'Skip this step',
  skipTo,
}: {
  weddingId: string
  prev: StepId | null
  next: StepId | null
  nextLabel?: string
  skipLabel?: string
  skipTo?: StepId | null
}) {
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-neutral-100">
      <div>
        {prev && (
          <Link
            href={`/weddings/${weddingId}/couple-form?step=${prev}`}
            className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
          >
            ← Back
          </Link>
        )}
      </div>
      <div className="flex items-center gap-3">
        {(skipTo !== undefined ? skipTo : next) && skipTo !== null && (
          <Link
            href={`/weddings/${weddingId}/couple-form?step=${skipTo ?? next}`}
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            {skipLabel}
          </Link>
        )}
        {next && (
          <Link
            href={`/weddings/${weddingId}/couple-form?step=${next}`}
            className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm"
          >
            {nextLabel}
          </Link>
        )}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function CoupleFormPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { step?: string }
}) {
  const wedding = await prisma.wedding.findUnique({
    where: { id: params.id },
    include: {
      people: {
        orderBy: [{ relationship: 'asc' }, { fullName: 'asc' }],
      },
    },
  })

  if (!wedding) notFound()

  const rawStep = searchParams.step ?? 'intro'
  const currentStep: StepId = (STEP_IDS as readonly string[]).includes(rawStep)
    ? (rawStep as StepId)
    : 'intro'

  const { prev, next } = getAdjacentSteps(currentStep)

  // Helpers to filter people by side + relationship
  const byCategory = (side: 'Bride' | 'Groom', ...relationships: string[]) =>
    wedding.people.filter(
      (p) => p.side === side && relationships.includes(p.relationship)
    )

  const brideName = wedding.brideName
  const groomName = wedding.groomName

  const stepColor = (step: StepId) => {
    if (step.startsWith('bride')) return 'bride'
    if (step.startsWith('groom')) return 'groom'
    return 'neutral'
  }
  const color = stepColor(currentStep)
  const accentBg = color === 'bride' ? 'bg-rose-50' : color === 'groom' ? 'bg-sky-50' : 'bg-neutral-50'
  const accentBorder = color === 'bride' ? 'border-rose-100' : color === 'groom' ? 'border-sky-100' : 'border-neutral-100'
  const accentBtn = color === 'bride' ? 'bg-rose-500 hover:bg-rose-600' : color === 'groom' ? 'bg-sky-600 hover:bg-sky-700' : 'bg-neutral-700 hover:bg-neutral-800'

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Top bar */}
      <div className="border-b border-neutral-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <p className="font-display text-lg text-neutral-800">
            {brideName} & {groomName}
          </p>
          {wedding.weddingDate && (
            <p className="text-sm text-neutral-500">
              {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <ProgressDots
          currentStep={currentStep}
          brideName={brideName}
          groomName={groomName}
        />

        {/* ── INTRO ─────────────────────────────────────────────────────── */}
        {currentStep === 'intro' && (
          <div className="text-center">
            <div className="text-5xl mb-6">💐</div>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-neutral-900 mb-3">
              Let's Build Your Photo List
            </h1>
            <p className="text-xl text-neutral-600 mb-2">
              {brideName} & {groomName}
            </p>
            {wedding.weddingDate && (
              <p className="text-neutral-500 mb-8">
                {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}

            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 mb-10 text-left">
              <h2 className="font-semibold text-neutral-900 mb-3">Here's how this works 👋</h2>
              <ul className="space-y-2 text-neutral-700">
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">✦</span>
                  We'll walk you through each part of your family, one step at a time.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">✦</span>
                  You can skip any section that doesn't apply to you.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">✦</span>
                  At the end, you can add anyone we missed.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">✦</span>
                  Takes about 5 minutes — your photographer will handle the rest!
                </li>
              </ul>
            </div>

            <Link
              href={`/weddings/${wedding.id}/couple-form?step=bride-parents`}
              className="inline-flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-colors shadow-md"
            >
              Let's Start
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        )}

        {/* ── BRIDE PARENTS ─────────────────────────────────────────────── */}
        {currentStep === 'bride-parents' && (() => {
          const added = byCategory('Bride', 'Mom', 'Dad', 'Step Mom', 'Step Dad')
          return (
            <div>
              <div className="mb-8">
                <p className="text-rose-500 font-medium text-sm uppercase tracking-wider mb-2">
                  {brideName}'s Family · Step 1 of 7
                </p>
                <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
                  {brideName}'s Parents
                </h1>
                <p className="text-neutral-600">
                  Start by telling us who {brideName}'s parents are. Skip anyone who won't be at the wedding.
                </p>
              </div>

              <div className={`${accentBg} ${accentBorder} border rounded-2xl p-6 space-y-5`}>
                {/* Mom */}
                <form action={addPerson} className="flex gap-3 items-end">
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="side" value="Bride" />
                  <input type="hidden" name="relationship" value="Mom" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      Mom's full name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-base"
                      placeholder="e.g. Patricia Smith"
                    />
                  </div>
                  <button
                    type="submit"
                    className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm transition-colors flex-shrink-0`}
                  >
                    Add
                  </button>
                </form>

                {/* Dad */}
                <form action={addPerson} className="space-y-2">
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="side" value="Bride" />
                  <input type="hidden" name="relationship" value="Dad" />
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Dad's full name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-base"
                        placeholder="e.g. Robert Smith"
                      />
                    </div>
                    <button
                      type="submit"
                      className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm transition-colors flex-shrink-0`}
                    >
                      Add
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-neutral-600 pl-1">
                    <input type="checkbox" name="isDivorced" className="w-4 h-4 rounded text-rose-500" />
                    Parents are divorced (we'll plan separate shots)
                  </label>
                </form>

                {/* Step parents */}
                <details className="group">
                  <summary className="text-sm font-medium text-neutral-600 cursor-pointer hover:text-neutral-900 list-none flex items-center gap-1.5 select-none">
                    <span className="text-rose-400 group-open:rotate-90 transition-transform inline-block">▶</span>
                    Add a step-parent
                  </summary>
                  <div className="mt-4 space-y-4 pl-4 border-l-2 border-rose-100">
                    <form action={addPerson} className="flex gap-3 items-end">
                      <input type="hidden" name="weddingId" value={wedding.id} />
                      <input type="hidden" name="side" value="Bride" />
                      <input type="hidden" name="relationship" value="Step Mom" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Step-Mom's name</label>
                        <input
                          type="text"
                          name="fullName"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-base"
                          placeholder="e.g. Sandra Miller"
                        />
                      </div>
                      <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                    </form>
                    <form action={addPerson} className="flex gap-3 items-end">
                      <input type="hidden" name="weddingId" value={wedding.id} />
                      <input type="hidden" name="side" value="Bride" />
                      <input type="hidden" name="relationship" value="Step Dad" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Step-Dad's name</label>
                        <input
                          type="text"
                          name="fullName"
                          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-base"
                          placeholder="e.g. James Miller"
                        />
                      </div>
                      <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                    </form>
                  </div>
                </details>
              </div>

              {added.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-neutral-500 mb-3">Added so far:</p>
                  <div className="space-y-2">
                    {added.map((p) => (
                      <PersonBadge key={p.id} name={p.fullName} relationship={p.relationship} isDivorced={p.isDivorced} />
                    ))}
                  </div>
                </div>
              )}

              <StepNav weddingId={wedding.id} prev={prev} next={next} nextLabel={`Next: ${groomName}'s Parents →`} />
            </div>
          )
        })()}

        {/* ── GROOM PARENTS ─────────────────────────────────────────────── */}
        {currentStep === 'groom-parents' && (() => {
          const added = byCategory('Groom', 'Mom', 'Dad', 'Step Mom', 'Step Dad')
          return (
            <div>
              <div className="mb-8">
                <p className="text-sky-600 font-medium text-sm uppercase tracking-wider mb-2">
                  {groomName}'s Family · Step 2 of 7
                </p>
                <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
                  {groomName}'s Parents
                </h1>
                <p className="text-neutral-600">
                  Now let's add {groomName}'s parents. Skip anyone who won't be at the wedding.
                </p>
              </div>

              <div className={`${accentBg} ${accentBorder} border rounded-2xl p-6 space-y-5`}>
                <form action={addPerson} className="flex gap-3 items-end">
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="side" value="Groom" />
                  <input type="hidden" name="relationship" value="Mom" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Mom's full name</label>
                    <input type="text" name="fullName" className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-base" placeholder="e.g. Linda Johnson" />
                  </div>
                  <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                </form>

                <form action={addPerson} className="space-y-2">
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="side" value="Groom" />
                  <input type="hidden" name="relationship" value="Dad" />
                  <div className="flex gap-3 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Dad's full name</label>
                      <input type="text" name="fullName" className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-base" placeholder="e.g. William Johnson" />
                    </div>
                    <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-neutral-600 pl-1">
                    <input type="checkbox" name="isDivorced" className="w-4 h-4 rounded text-sky-500" />
                    Parents are divorced (we'll plan separate shots)
                  </label>
                </form>

                <details className="group">
                  <summary className="text-sm font-medium text-neutral-600 cursor-pointer hover:text-neutral-900 list-none flex items-center gap-1.5 select-none">
                    <span className="text-sky-400 group-open:rotate-90 transition-transform inline-block">▶</span>
                    Add a step-parent
                  </summary>
                  <div className="mt-4 space-y-4 pl-4 border-l-2 border-sky-100">
                    <form action={addPerson} className="flex gap-3 items-end">
                      <input type="hidden" name="weddingId" value={wedding.id} />
                      <input type="hidden" name="side" value="Groom" />
                      <input type="hidden" name="relationship" value="Step Mom" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Step-Mom's name</label>
                        <input type="text" name="fullName" className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-base" placeholder="e.g. Carol Davis" />
                      </div>
                      <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                    </form>
                    <form action={addPerson} className="flex gap-3 items-end">
                      <input type="hidden" name="weddingId" value={wedding.id} />
                      <input type="hidden" name="side" value="Groom" />
                      <input type="hidden" name="relationship" value="Step Dad" />
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Step-Dad's name</label>
                        <input type="text" name="fullName" className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-base" placeholder="e.g. Mark Davis" />
                      </div>
                      <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                    </form>
                  </div>
                </details>
              </div>

              {added.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-neutral-500 mb-3">Added so far:</p>
                  <div className="space-y-2">
                    {added.map((p) => (
                      <PersonBadge key={p.id} name={p.fullName} relationship={p.relationship} isDivorced={p.isDivorced} />
                    ))}
                  </div>
                </div>
              )}

              <StepNav weddingId={wedding.id} prev={prev} next={next} nextLabel={`Next: ${brideName}'s Siblings →`} />
            </div>
          )
        })()}

        {/* ── BRIDE SIBLINGS ────────────────────────────────────────────── */}
        {currentStep === 'bride-siblings' && (() => {
          const added = byCategory('Bride', 'Sibling', 'Sibling Spouse/Partner')
          return (
            <div>
              <div className="mb-8">
                <p className="text-rose-500 font-medium text-sm uppercase tracking-wider mb-2">
                  {brideName}'s Family · Step 3 of 7
                </p>
                <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
                  {brideName}'s Siblings
                </h1>
                <p className="text-neutral-600">
                  Add {brideName}'s brothers and sisters, and their partners if they'll be in photos. You can add as many as you like.
                </p>
              </div>

              <div className={`${accentBg} ${accentBorder} border rounded-2xl p-6 space-y-5`}>
                <form action={addPerson} className="flex gap-3 items-end">
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="side" value="Bride" />
                  <input type="hidden" name="relationship" value="Sibling" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Sibling's full name</label>
                    <input
                      type="text"
                      name="fullName"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-base"
                      placeholder="e.g. Emily Smith"
                    />
                  </div>
                  <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                </form>

                <form action={addPerson} className="flex gap-3 items-end">
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="side" value="Bride" />
                  <input type="hidden" name="relationship" value="Sibling Spouse/Partner" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      A sibling's spouse / partner
                      <span className="text-neutral-400 font-normal ml-1">(optional)</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-base"
                      placeholder="e.g. Tom Williams"
                    />
                  </div>
                  <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                </form>
              </div>

              {added.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-neutral-500 mb-3">Added so far:</p>
                  <div className="space-y-2">
                    {added.map((p) => (
                      <PersonBadge key={p.id} name={p.fullName} relationship={p.relationship} />
                    ))}
                  </div>
                </div>
              )}

              <StepNav weddingId={wedding.id} prev={prev} next={next} nextLabel={`Next: ${groomName}'s Siblings →`} />
            </div>
          )
        })()}

        {/* ── GROOM SIBLINGS ────────────────────────────────────────────── */}
        {currentStep === 'groom-siblings' && (() => {
          const added = byCategory('Groom', 'Sibling', 'Sibling Spouse/Partner')
          return (
            <div>
              <div className="mb-8">
                <p className="text-sky-600 font-medium text-sm uppercase tracking-wider mb-2">
                  {groomName}'s Family · Step 4 of 7
                </p>
                <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
                  {groomName}'s Siblings
                </h1>
                <p className="text-neutral-600">
                  Add {groomName}'s brothers and sisters, and their partners if they'll be in photos.
                </p>
              </div>

              <div className={`${accentBg} ${accentBorder} border rounded-2xl p-6 space-y-5`}>
                <form action={addPerson} className="flex gap-3 items-end">
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="side" value="Groom" />
                  <input type="hidden" name="relationship" value="Sibling" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Sibling's full name</label>
                    <input type="text" name="fullName" className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-base" placeholder="e.g. Michael Johnson" />
                  </div>
                  <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                </form>

                <form action={addPerson} className="flex gap-3 items-end">
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="side" value="Groom" />
                  <input type="hidden" name="relationship" value="Sibling Spouse/Partner" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                      A sibling's spouse / partner
                      <span className="text-neutral-400 font-normal ml-1">(optional)</span>
                    </label>
                    <input type="text" name="fullName" className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-base" placeholder="e.g. Sarah Johnson" />
                  </div>
                  <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                </form>
              </div>

              {added.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-neutral-500 mb-3">Added so far:</p>
                  <div className="space-y-2">
                    {added.map((p) => (
                      <PersonBadge key={p.id} name={p.fullName} relationship={p.relationship} />
                    ))}
                  </div>
                </div>
              )}

              <StepNav weddingId={wedding.id} prev={prev} next={next} nextLabel={`Next: ${brideName}'s Grandparents →`} />
            </div>
          )
        })()}

        {/* ── BRIDE GRANDPARENTS ────────────────────────────────────────── */}
        {currentStep === 'bride-grandparents' && (() => {
          const added = byCategory('Bride', 'Grandparent')
          return (
            <div>
              <div className="mb-8">
                <p className="text-rose-500 font-medium text-sm uppercase tracking-wider mb-2">
                  {brideName}'s Family · Step 5 of 7
                </p>
                <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
                  {brideName}'s Grandparents
                </h1>
                <p className="text-neutral-600">
                  Will any grandparents be attending? Add them here so we can make sure they're included.
                </p>
              </div>

              <div className={`${accentBg} ${accentBorder} border rounded-2xl p-6`}>
                <form action={addPerson} className="flex gap-3 items-end">
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="side" value="Bride" />
                  <input type="hidden" name="relationship" value="Grandparent" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Grandparent's full name</label>
                    <input
                      type="text"
                      name="fullName"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-base"
                      placeholder="e.g. Dorothy Smith"
                    />
                  </div>
                  <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                </form>
              </div>

              {added.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-neutral-500 mb-3">Added so far:</p>
                  <div className="space-y-2">
                    {added.map((p) => (
                      <PersonBadge key={p.id} name={p.fullName} relationship={p.relationship} />
                    ))}
                  </div>
                </div>
              )}

              <StepNav weddingId={wedding.id} prev={prev} next={next} nextLabel={`Next: ${groomName}'s Grandparents →`} />
            </div>
          )
        })()}

        {/* ── GROOM GRANDPARENTS ────────────────────────────────────────── */}
        {currentStep === 'groom-grandparents' && (() => {
          const added = byCategory('Groom', 'Grandparent')
          return (
            <div>
              <div className="mb-8">
                <p className="text-sky-600 font-medium text-sm uppercase tracking-wider mb-2">
                  {groomName}'s Family · Step 6 of 7
                </p>
                <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
                  {groomName}'s Grandparents
                </h1>
                <p className="text-neutral-600">
                  Will any of {groomName}'s grandparents be at the wedding?
                </p>
              </div>

              <div className={`${accentBg} ${accentBorder} border rounded-2xl p-6`}>
                <form action={addPerson} className="flex gap-3 items-end">
                  <input type="hidden" name="weddingId" value={wedding.id} />
                  <input type="hidden" name="side" value="Groom" />
                  <input type="hidden" name="relationship" value="Grandparent" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Grandparent's full name</label>
                    <input
                      type="text"
                      name="fullName"
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-base"
                      placeholder="e.g. Harold Johnson"
                    />
                  </div>
                  <button type="submit" className={`${accentBtn} text-white px-4 py-3 rounded-xl font-medium text-sm flex-shrink-0`}>Add</button>
                </form>
              </div>

              {added.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm font-medium text-neutral-500 mb-3">Added so far:</p>
                  <div className="space-y-2">
                    {added.map((p) => (
                      <PersonBadge key={p.id} name={p.fullName} relationship={p.relationship} />
                    ))}
                  </div>
                </div>
              )}

              <StepNav weddingId={wedding.id} prev={prev} next={next} nextLabel="Next: Anyone Else? →" />
            </div>
          )
        })()}

        {/* ── EXTRAS ────────────────────────────────────────────────────── */}
        {currentStep === 'extras' && (() => {
          const EXTRA_RELATIONSHIPS = ['Aunt/Uncle', 'Cousin', 'Friend', 'Other']
          const brideSide = wedding.people.filter((p) => p.side === 'Bride')
          const groomSide = wedding.people.filter((p) => p.side === 'Groom')

          return (
            <div>
              <div className="mb-8">
                <p className="text-neutral-500 font-medium text-sm uppercase tracking-wider mb-2">
                  Almost done · Step 7 of 7
                </p>
                <h1 className="font-display text-4xl font-bold text-neutral-900 mb-2">
                  Anyone Else?
                </h1>
                <p className="text-neutral-600">
                  Aunts, uncles, cousins, close friends — add anyone else who should be in family photos.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {/* Bride side */}
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-5">
                  <h3 className="font-semibold text-rose-700 mb-4">{brideName}'s Side</h3>
                  <form action={addPerson} className="space-y-3">
                    <input type="hidden" name="weddingId" value={wedding.id} />
                    <input type="hidden" name="side" value="Bride" />
                    <input
                      type="text"
                      name="fullName"
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-sm"
                      placeholder="Full name"
                    />
                    <select
                      name="relationship"
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-rose-400 bg-white text-sm"
                    >
                      <option value="">Relationship...</option>
                      {EXTRA_RELATIONSHIPS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="w-full bg-rose-500 hover:bg-rose-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      + Add to {brideName}'s side
                    </button>
                  </form>
                  {brideSide.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      {brideSide.map((p) => (
                        <div key={p.id} className="text-xs text-neutral-700 bg-white rounded-lg px-3 py-2 border border-neutral-100">
                          <span className="font-medium">{p.fullName}</span>
                          <span className="text-neutral-400 ml-1">· {p.relationship}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Groom side */}
                <div className="bg-sky-50 border border-sky-100 rounded-2xl p-5">
                  <h3 className="font-semibold text-sky-700 mb-4">{groomName}'s Side</h3>
                  <form action={addPerson} className="space-y-3">
                    <input type="hidden" name="weddingId" value={wedding.id} />
                    <input type="hidden" name="side" value="Groom" />
                    <input
                      type="text"
                      name="fullName"
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm"
                      placeholder="Full name"
                    />
                    <select
                      name="relationship"
                      required
                      className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white text-sm"
                    >
                      <option value="">Relationship...</option>
                      {EXTRA_RELATIONSHIPS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                      + Add to {groomName}'s side
                    </button>
                  </form>
                  {groomSide.length > 0 && (
                    <div className="mt-4 space-y-1.5">
                      {groomSide.map((p) => (
                        <div key={p.id} className="text-xs text-neutral-700 bg-white rounded-lg px-3 py-2 border border-neutral-100">
                          <span className="font-medium">{p.fullName}</span>
                          <span className="text-neutral-400 ml-1">· {p.relationship}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <StepNav weddingId={wedding.id} prev={prev} next={next} nextLabel="I'm done! →" skipLabel="Skip — I'm done" />
            </div>
          )
        })()}

        {/* ── DONE ──────────────────────────────────────────────────────── */}
        {currentStep === 'done' && (() => {
          const brideSide = wedding.people.filter((p) => p.side === 'Bride')
          const groomSide = wedding.people.filter((p) => p.side === 'Groom')

          const groupByRelationship = (people: typeof wedding.people) => {
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
              <h1 className="font-display text-4xl sm:text-5xl font-bold text-neutral-900 mb-3">
                You're all set!
              </h1>
              <p className="text-lg text-neutral-600 mb-8">
                Your photographer will use this list to make sure every important person gets the perfect photo.
              </p>

              {wedding.people.length > 0 && (
                <div className="text-left mb-10">
                  <h2 className="font-display text-2xl font-semibold text-neutral-800 mb-6 text-center">
                    Your Family List ({wedding.people.length} people)
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold text-rose-600 mb-3 text-center bg-rose-50 rounded-xl py-2">
                        {brideName}'s Family · {brideSide.length}
                      </h3>
                      {groupByRelationship(brideSide).map(({ relationship, people }) => (
                        <div key={relationship} className="mb-3">
                          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1 px-1">{relationship}</p>
                          {people.map((p) => (
                            <div key={p.id} className="text-sm text-neutral-800 py-1.5 px-3 bg-rose-50/50 rounded-lg mb-1">
                              {p.fullName}
                              {p.isDivorced && <span className="text-xs text-amber-600 ml-2">divorced</span>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="font-semibold text-sky-600 mb-3 text-center bg-sky-50 rounded-xl py-2">
                        {groomName}'s Family · {groomSide.length}
                      </h3>
                      {groupByRelationship(groomSide).map(({ relationship, people }) => (
                        <div key={relationship} className="mb-3">
                          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-1 px-1">{relationship}</p>
                          {people.map((p) => (
                            <div key={p.id} className="text-sm text-neutral-800 py-1.5 px-3 bg-sky-50/50 rounded-lg mb-1">
                              {p.fullName}
                              {p.isDivorced && <span className="text-xs text-amber-600 ml-2">divorced</span>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-stone-50 border border-neutral-200 rounded-2xl p-6 text-left mb-6">
                <p className="text-neutral-700 mb-2">
                  ✨ <strong>Need to make changes?</strong> Just bookmark this page — you can come back anytime to add or update your list before the wedding.
                </p>
                <p className="text-sm text-neutral-500">
                  Have questions? Don't hesitate to reach out to your photographer directly.
                </p>
              </div>

              <Link
                href={`/weddings/${wedding.id}/couple-form?step=extras`}
                className="text-sm text-neutral-500 hover:text-neutral-700"
              >
                ← Go back and add someone
              </Link>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
