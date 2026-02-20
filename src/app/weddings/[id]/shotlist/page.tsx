import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function updateStatus(formData: FormData) {
  'use server'
  const groupId = formData.get('groupId') as string
  const weddingId = formData.get('weddingId') as string
  const newStatus = formData.get('status') as string

  await prisma.photoGroup.update({
    where: { id: groupId },
    data: { status: newStatus },
  })

  revalidatePath(`/weddings/${weddingId}/shotlist`)
}

type PhotoGroup = {
  id: string
  groupName: string
  side: string
  priority: string
  orderNum: number
  notes: string | null
  status: string
  people: {
    personId: string
    person: { fullName: string } | null
  }[]
}

function StatusButton({
  group,
  weddingId,
}: {
  group: PhotoGroup
  weddingId: string
}) {
  const next =
    group.status === 'Not Ready' ? 'Ready'
    : group.status === 'Ready' ? 'Shot'
    : 'Not Ready'

  const isShot = group.status === 'Shot'
  const isReady = group.status === 'Ready'

  return (
    <form action={updateStatus}>
      <input type="hidden" name="groupId" value={group.id} />
      <input type="hidden" name="weddingId" value={weddingId} />
      <input type="hidden" name="status" value={next} />
      <button
        type="submit"
        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
          isShot
            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            : isReady
            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
        }`}
      >
        {isShot ? '✓ Shot' : isReady ? '● Ready' : '○ Not Ready'}
      </button>
    </form>
  )
}

function SectionBlock({
  title,
  groups,
  weddingId,
  brideName,
  groomName,
  accentClass,
}: {
  title: string
  groups: PhotoGroup[]
  weddingId: string
  brideName: string
  groomName: string
  accentClass: string
}) {
  if (groups.length === 0) return null

  const shotCount = groups.filter((g) => g.status === 'Shot').length
  const mustHaveCount = groups.filter((g) => g.priority === 'Must-have').length

  const sorted = [...groups].sort((a, b) => {
    if (a.priority === b.priority) return a.orderNum - b.orderNum
    return a.priority === 'Must-have' ? -1 : 1
  })

  const active = sorted.filter((g) => g.status !== 'Shot')
  const shot = sorted.filter((g) => g.status === 'Shot')

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-1 w-6 rounded-full ${accentClass}`} />
        <h2 className="font-semibold text-neutral-800 text-base">{title}</h2>
        <span className="text-sm text-neutral-400">
          {shotCount}/{groups.length} shot
          {mustHaveCount > 0 && (
            <span className="ml-2 text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
              {mustHaveCount} must-have
            </span>
          )}
        </span>
      </div>

      <div className="space-y-1.5">
        {active.map((group) => {
          const people = group.people.map((p) => {
            if (p.personId === 'bride') return brideName
            if (p.personId === 'groom') return groomName
            return p.person?.fullName ?? '?'
          })

          return (
            <div
              key={group.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${
                group.status === 'Ready'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-white border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center ${
                  group.status === 'Ready'
                    ? 'bg-yellow-400 text-white'
                    : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {group.orderNum}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-neutral-900 text-sm">{group.groupName}</span>
                  {group.priority === 'Must-have' && (
                    <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-medium">Must</span>
                  )}
                </div>
                {people.length > 0 && (
                  <p className="text-xs text-neutral-500 mt-0.5 truncate">{people.join(', ')}</p>
                )}
                {group.notes && (
                  <p className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                    {group.notes}
                  </p>
                )}
              </div>

              <div className="flex-shrink-0">
                <StatusButton group={group} weddingId={weddingId} />
              </div>
            </div>
          )
        })}
      </div>

      {shot.length > 0 && (
        <div className="mt-2 space-y-1">
          {shot.map((group) => {
            const people = group.people.map((p) => {
              if (p.personId === 'bride') return brideName
              if (p.personId === 'groom') return groomName
              return p.person?.fullName ?? '?'
            })
            return (
              <div
                key={group.id}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 opacity-60"
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center bg-emerald-500 text-white">✓</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-neutral-600 line-through">{group.groupName}</span>
                  {people.length > 0 && (
                    <p className="text-xs text-neutral-400 truncate">{people.join(', ')}</p>
                  )}
                </div>
                <StatusButton group={group} weddingId={weddingId} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default async function ShotListPage({
  params,
}: {
  params: { id: string }
}) {
  const wedding = await prisma.wedding.findUnique({
    where: { id: params.id },
    include: {
      photoGroups: {
        include: {
          people: {
            include: {
              person: true,
            },
          },
        },
        orderBy: { orderNum: 'asc' },
      },
    },
  })

  if (!wedding) notFound()

  const all = wedding.photoGroups
  const brideGroups = all.filter((g) => g.side === 'Bride')
  const groomGroups = all.filter((g) => g.side === 'Groom')
  const mixedGroups = all.filter((g) => g.side === 'Mixed')

  const totalShot = all.filter((g) => g.status === 'Shot').length
  const totalReady = all.filter((g) => g.status === 'Ready').length
  const totalNotReady = all.filter((g) => g.status === 'Not Ready').length
  const pct = all.length > 0 ? Math.round((totalShot / all.length) * 100) : 0

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sticky header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10 no-print">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link href={`/weddings/${wedding.id}`} className="text-neutral-500 hover:text-neutral-800 text-sm flex items-center gap-1 mb-0.5">
                ← Back
              </Link>
              <h1 className="font-bold text-neutral-900 text-lg leading-tight">
                {wedding.brideName} & {wedding.groomName}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-2xl font-bold text-neutral-900 leading-none">{pct}%</div>
                <div className="text-xs text-neutral-500">{totalShot}/{all.length} shot</div>
              </div>
              <Link href={`/weddings/${wedding.id}/print`} className="btn btn-secondary btn-sm">Print</Link>
            </div>
          </div>

          <div className="mt-2 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all duration-500 rounded-full" style={{ width: `${pct}%` }} />
          </div>

          <div className="flex gap-4 mt-2 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-neutral-300 inline-block" />{totalNotReady} not ready</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />{totalReady} ready</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />{totalShot} shot</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {all.length === 0 ? (
          <div className="card text-center py-12">
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">No photo groups yet</h3>
            <p className="text-neutral-500 mb-4">Create some groups first</p>
            <Link href={`/weddings/${wedding.id}/groups`} className="btn btn-primary">Create Groups</Link>
          </div>
        ) : (
          <>
            <SectionBlock
              title={`${wedding.brideName}'s Family`}
              groups={brideGroups}
              weddingId={wedding.id}
              brideName={wedding.brideName}
              groomName={wedding.groomName}
              accentClass="bg-rose-400"
            />
            <SectionBlock
              title={`${wedding.groomName}'s Family`}
              groups={groomGroups}
              weddingId={wedding.id}
              brideName={wedding.brideName}
              groomName={wedding.groomName}
              accentClass="bg-sky-400"
            />
            <SectionBlock
              title="Together / Mixed"
              groups={mixedGroups}
              weddingId={wedding.id}
              brideName={wedding.brideName}
              groomName={wedding.groomName}
              accentClass="bg-purple-400"
            />
          </>
        )}
      </div>
    </div>
  )
}
