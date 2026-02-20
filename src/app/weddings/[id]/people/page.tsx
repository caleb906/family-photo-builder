import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DeletePersonButton } from '@/components/DeletePersonButton'
import { CopyLinkButton } from '@/components/CopyLinkButton'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

const RELATIONSHIPS = [
  'Mom',
  'Dad',
  'Step Mom',
  'Step Dad',
  'Sibling',
  'Sibling Spouse/Partner',
  'Grandparent',
  'Aunt/Uncle',
  'Cousin',
  'Friend',
  'Other',
]

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
  
  revalidatePath(`/weddings/${weddingId}/people`)
}

async function deletePerson(formData: FormData) {
  'use server'
  const personId = formData.get('personId') as string
  const weddingId = formData.get('weddingId') as string

  await prisma.person.delete({
    where: { id: personId },
  })
  revalidatePath(`/weddings/${weddingId}/people`)
}

export default async function PeoplePage({
  params,
}: {
  params: { id: string }
}) {
  const wedding = await prisma.wedding.findUnique({
    where: { id: params.id },
    include: {
      people: {
        orderBy: [
          { side: 'asc' },
          { relationship: 'asc' },
          { fullName: 'asc' },
        ],
      },
    },
  })

  if (!wedding) {
    notFound()
  }

  const brideSide = wedding.people.filter(p => p.side === 'Bride')
  const groomSide = wedding.people.filter(p => p.side === 'Groom')

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Link href={`/weddings/${wedding.id}`} className="text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-2 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to dashboard
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 mb-2">Family & Friends</h1>
              <p className="text-neutral-600">
                Add people for {wedding.brideName} & {wedding.groomName}
              </p>
            </div>
            {/* Share Link */}
            <div className="flex gap-2">
              <Link
                href={`/weddings/${wedding.id}/couple-form`}
                className="btn btn-secondary"
                target="_blank"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Couple Form
              </Link>
              <CopyLinkButton weddingId={wedding.id} />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add Person Form */}
          <div className="animate-slide-up">
            <form action={addPerson} className="card sticky top-4">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">Add New Person</h2>
              
              <input type="hidden" name="weddingId" value={wedding.id} />
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="label">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    required
                    className="input"
                    placeholder="e.g., Jennifer Smith"
                  />
                </div>

                <div>
                  <label htmlFor="side" className="label">Side *</label>
                  <select id="side" name="side" required className="input">
                    <option value="">Select side...</option>
                    <option value="Bride">Bride's Side</option>
                    <option value="Groom">Groom's Side</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="relationship" className="label">Relationship *</label>
                  <select id="relationship" name="relationship" required className="input">
                    <option value="">Select relationship...</option>
                    {RELATIONSHIPS.map((rel) => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="notes" className="label">Notes (optional)</label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={2}
                    className="input"
                    placeholder="Special instructions..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDivorced"
                    name="isDivorced"
                    className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <label htmlFor="isDivorced" className="text-sm text-neutral-700">
                    Parents are divorced (needs separate photos)
                  </label>
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Person
                </button>
              </div>
            </form>
          </div>

          {/* People Lists — side by side on desktop */}
          <div className="grid sm:grid-cols-2 gap-4 animate-slide-up animate-delay-100">
            {/* Bride's Side */}
            <div className="card">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <span className="badge badge-bride">Bride's Side</span>
                <span className="text-sm font-normal text-neutral-500">
                  {brideSide.length} {brideSide.length === 1 ? 'person' : 'people'}
                </span>
              </h2>
              
              {brideSide.length === 0 ? (
                <p className="text-neutral-500 text-sm py-4">No people added yet</p>
              ) : (
                <div className="space-y-2">
                  {brideSide.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-900">{person.fullName}</div>
                        <div className="text-sm text-neutral-600 flex items-center gap-2 flex-wrap">
                          <span>{person.relationship}</span>
                          {person.isDivorced && (
                            <span className="badge bg-orange-100 text-orange-800 text-xs">
                              Divorced
                            </span>
                          )}
                        </div>
                        {person.notes && (
                          <div className="text-xs text-neutral-500 mt-1">{person.notes}</div>
                        )}
                      </div>
                      <DeletePersonButton
                        personId={person.id}
                        weddingId={wedding.id}
                        personName={person.fullName}
                        deleteAction={deletePerson}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Groom's Side */}
            <div className="card">
              <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <span className="badge badge-groom">Groom's Side</span>
                <span className="text-sm font-normal text-neutral-500">
                  {groomSide.length} {groomSide.length === 1 ? 'person' : 'people'}
                </span>
              </h2>
              
              {groomSide.length === 0 ? (
                <p className="text-neutral-500 text-sm py-4">No people added yet</p>
              ) : (
                <div className="space-y-2">
                  {groomSide.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-neutral-900">{person.fullName}</div>
                        <div className="text-sm text-neutral-600 flex items-center gap-2 flex-wrap">
                          <span>{person.relationship}</span>
                          {person.isDivorced && (
                            <span className="badge bg-orange-100 text-orange-800 text-xs">
                              Divorced
                            </span>
                          )}
                        </div>
                        {person.notes && (
                          <div className="text-xs text-neutral-500 mt-1">{person.notes}</div>
                        )}
                      </div>
                      <DeletePersonButton
                        personId={person.id}
                        weddingId={wedding.id}
                        personName={person.fullName}
                        deleteAction={deletePerson}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
