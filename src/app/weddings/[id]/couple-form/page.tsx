import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
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
  
  revalidatePath(`/weddings/${weddingId}/couple-form`)
}

export default async function CoupleFormPage({
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
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-3">
            Family Photo List
          </h1>
          <p className="text-2xl text-neutral-700 mb-2">
            {wedding.brideName} & {wedding.groomName}
          </p>
          {wedding.weddingDate && (
            <p className="text-lg text-neutral-600">
              {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          )}
          <div className="mt-4 p-4 bg-primary-100 rounded-lg border border-primary-200 inline-block">
            <p className="text-neutral-800">
              👋 Hi! Please add your family members below so we can organize the perfect photos for your wedding day!
            </p>
          </div>
        </div>

        {/* Add Person Form */}
        <div className="card mb-8 animate-slide-up">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Add a Family Member</h2>
          
          <form action={addPerson} className="space-y-5">
            <input type="hidden" name="weddingId" value={wedding.id} />
            
            <div>
              <label htmlFor="fullName" className="label text-base">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                required
                className="input text-lg"
                placeholder="e.g., Jennifer Smith"
              />
            </div>

            <div>
              <label htmlFor="side" className="label text-base">Which side? *</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="relative">
                  <input
                    type="radio"
                    name="side"
                    value="Bride"
                    required
                    className="peer sr-only"
                  />
                  <div className="btn btn-secondary w-full peer-checked:bg-pink-600 peer-checked:text-white peer-checked:border-pink-600 cursor-pointer">
                    {wedding.brideName}'s Side
                  </div>
                </label>
                <label className="relative">
                  <input
                    type="radio"
                    name="side"
                    value="Groom"
                    required
                    className="peer sr-only"
                  />
                  <div className="btn btn-secondary w-full peer-checked:bg-blue-600 peer-checked:text-white peer-checked:border-blue-600 cursor-pointer">
                    {wedding.groomName}'s Side
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="relationship" className="label text-base">Relationship *</label>
              <select id="relationship" name="relationship" required className="input text-lg">
                <option value="">Select relationship...</option>
                {RELATIONSHIPS.map((rel) => (
                  <option key={rel} value={rel}>{rel}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="notes" className="label text-base">
                Special Notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                className="input text-base"
                placeholder="Any special instructions for the photographer..."
              />
              <p className="text-sm text-neutral-500 mt-1">
                Example: "Lives out of state, arrives day before wedding"
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <input
                type="checkbox"
                id="isDivorced"
                name="isDivorced"
                className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 mt-0.5 flex-shrink-0"
              />
              <label htmlFor="isDivorced" className="text-sm text-neutral-700">
                <strong>Check if parents are divorced</strong> - The photographer will take separate photos if needed
              </label>
            </div>

            <button type="submit" className="btn btn-primary w-full btn-lg text-lg">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Person
            </button>
          </form>
        </div>

        {/* Current People List */}
        <div className="space-y-6 animate-slide-up animate-delay-100">
          <h2 className="text-2xl font-semibold text-neutral-900 flex items-center gap-2">
            People Added So Far
            <span className="text-base font-normal text-neutral-500">
              ({wedding.people.length} total)
            </span>
          </h2>

          {wedding.people.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-neutral-500">No people added yet. Add your first family member above!</p>
            </div>
          )}

          {/* Bride's Side */}
          {brideSide.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <span className="badge badge-bride text-base px-3 py-1">{wedding.brideName}'s Side</span>
                <span className="text-sm font-normal text-neutral-500">
                  {brideSide.length} {brideSide.length === 1 ? 'person' : 'people'}
                </span>
              </h3>
              <div className="space-y-2">
                {brideSide.map((person) => (
                  <div
                    key={person.id}
                    className="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <div className="font-semibold text-lg text-neutral-900">{person.fullName}</div>
                    <div className="text-base text-neutral-600 flex items-center gap-2 flex-wrap mt-1">
                      <span>{person.relationship}</span>
                      {person.isDivorced && (
                        <span className="badge bg-orange-100 text-orange-800">
                          Divorced Parents
                        </span>
                      )}
                    </div>
                    {person.notes && (
                      <div className="text-sm text-neutral-600 mt-2 bg-white px-3 py-2 rounded border border-neutral-200">
                        <strong>Note:</strong> {person.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Groom's Side */}
          {groomSide.length > 0 && (
            <div className="card">
              <h3 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                <span className="badge badge-groom text-base px-3 py-1">{wedding.groomName}'s Side</span>
                <span className="text-sm font-normal text-neutral-500">
                  {groomSide.length} {groomSide.length === 1 ? 'person' : 'people'}
                </span>
              </h3>
              <div className="space-y-2">
                {groomSide.map((person) => (
                  <div
                    key={person.id}
                    className="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
                  >
                    <div className="font-semibold text-lg text-neutral-900">{person.fullName}</div>
                    <div className="text-base text-neutral-600 flex items-center gap-2 flex-wrap mt-1">
                      <span>{person.relationship}</span>
                      {person.isDivorced && (
                        <span className="badge bg-orange-100 text-orange-800">
                          Divorced Parents
                        </span>
                      )}
                    </div>
                    {person.notes && (
                      <div className="text-sm text-neutral-600 mt-2 bg-white px-3 py-2 rounded border border-neutral-200">
                        <strong>Note:</strong> {person.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 p-6 bg-white rounded-xl border border-neutral-200 text-center">
          <p className="text-neutral-600">
            ✨ Thank you for adding your family! Your photographer will use this to create an organized shot list for your wedding day.
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            You can keep this link and come back anytime to add more people.
          </p>
        </div>
      </div>
    </div>
  )
}
