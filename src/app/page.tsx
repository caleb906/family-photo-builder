import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { DeleteWeddingButton } from '@/components/DeleteWeddingButton'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function deleteWedding(formData: FormData) {
  'use server'
  const weddingId = formData.get('weddingId') as string

  await prisma.wedding.delete({
    where: { id: weddingId },
  })
  revalidatePath('/')
}

export default async function HomePage() {
  const weddings = await prisma.wedding.findMany({
    orderBy: {
      weddingDate: 'desc'
    },
    include: {
      _count: {
        select: {
          people: true,
          photoGroups: true
        }
      }
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-100">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-5xl sm:text-6xl font-bold text-neutral-900 mb-4 tracking-tight">
            Family Photo Builder
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
            Create organized shot lists for wedding day family photos
          </p>
        </div>

        {/* Create New Wedding Button */}
        <div className="mb-8 animate-slide-up">
          <Link 
            href="/weddings/new"
            className="btn btn-primary btn-lg w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Wedding
          </Link>
        </div>

        {/* Weddings List */}
        {weddings.length === 0 ? (
          <div className="card text-center py-16 animate-slide-up animate-delay-100">
            <div className="text-neutral-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">No weddings yet</h3>
            <p className="text-neutral-500">Create your first wedding to get started</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {weddings.map((wedding, index) => (
              <div
                key={wedding.id}
                className="card hover:shadow-lg transition-all duration-200 group animate-slide-up relative"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Delete Button */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <DeleteWeddingButton 
                    weddingId={wedding.id}
                    weddingName={`${wedding.brideName} & ${wedding.groomName}`}
                    deleteAction={deleteWedding}
                  />
                </div>

                <Link
                  href={`/weddings/${wedding.id}`}
                  className="block"
                >
                  <div className="flex items-start justify-between mb-3 pr-8">
                    <div className="flex-1">
                      <h3 className="font-display text-xl font-semibold text-neutral-900 mb-1">
                        {wedding.brideName} & {wedding.groomName}
                      </h3>
                      {wedding.weddingDate && (
                        <p className="text-sm text-neutral-500">
                          {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-4 text-sm text-neutral-600 pt-3 border-t border-neutral-100">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      {wedding._count.people} people
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {wedding._count.photoGroups} groups
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
