import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

async function createWedding(formData: FormData) {
  'use server'
  
  const brideName = formData.get('brideName') as string
  const groomName = formData.get('groomName') as string
  const weddingDate = formData.get('weddingDate') as string
  const notes = formData.get('notes') as string
  
  const wedding = await prisma.wedding.create({
    data: {
      brideName,
      groomName,
      weddingDate: weddingDate ? new Date(weddingDate) : null,
      notes: notes || null,
    },
  })
  
  redirect(`/weddings/${wedding.id}`)
}

export default function NewWeddingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Create New Wedding</h1>
          <p className="text-neutral-600">Enter the couple's information to get started</p>
        </div>

        <form action={createWedding} className="card animate-slide-up">
          <div className="space-y-6">
            {/* Bride Name */}
            <div>
              <label htmlFor="brideName" className="label">
                Bride's Name *
              </label>
              <input
                type="text"
                id="brideName"
                name="brideName"
                required
                className="input"
                placeholder="e.g., Sarah"
              />
            </div>

            {/* Groom Name */}
            <div>
              <label htmlFor="groomName" className="label">
                Groom's Name *
              </label>
              <input
                type="text"
                id="groomName"
                name="groomName"
                required
                className="input"
                placeholder="e.g., Michael"
              />
            </div>

            {/* Wedding Date */}
            <div>
              <label htmlFor="weddingDate" className="label">
                Wedding Date (optional)
              </label>
              <input
                type="date"
                id="weddingDate"
                name="weddingDate"
                className="input"
              />
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="label">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                className="input"
                placeholder="Any special instructions or reminders..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="btn btn-primary flex-1"
              >
                Create Wedding
              </button>
              <a
                href="/"
                className="btn btn-secondary"
              >
                Cancel
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
