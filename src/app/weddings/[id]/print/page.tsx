import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function PrintPage({
  params,
}: {
  params: { id: string }
}) {
  const wedding = await prisma.wedding.findUnique({
    where: { id: params.id },
    include: {
      people: {
        orderBy: { fullName: 'asc' },
      },
      photoGroups: {
        include: {
          people: true,
        },
        orderBy: { orderNum: 'asc' },
      },
    },
  })

  if (!wedding) {
    notFound()
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <>
      {/* Print Button - Hidden when printing */}
      <div className="no-print fixed top-4 right-4 z-50">
        <Link 
          href={`/weddings/${wedding.id}/shotlist`}
          className="btn btn-secondary mr-2"
        >
          ← Back
        </Link>
        <button
          onClick={() => window.print()}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      {/* Print Content */}
      <div className="max-w-4xl mx-auto p-8 bg-white min-h-screen">
        {/* Header */}
        <div className="mb-8 pb-6 border-b-2 border-neutral-900">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Family Photo Shot List
          </h1>
          <div className="text-xl text-neutral-700 mb-1">
            {wedding.brideName} & {wedding.groomName}
          </div>
          {wedding.weddingDate && (
            <div className="text-neutral-600">
              Wedding Date: {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          )}
          <div className="text-sm text-neutral-500 mt-2">
            Printed: {today}
          </div>
        </div>

        {/* Quick Reference */}
        <div className="mb-6 p-4 bg-neutral-100 rounded-lg">
          <h2 className="font-semibold text-neutral-900 mb-2">Quick Reference</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-neutral-600">Total Groups</div>
              <div className="text-xl font-bold text-neutral-900">{wedding.photoGroups.length}</div>
            </div>
            <div>
              <div className="text-neutral-600">Must-Have</div>
              <div className="text-xl font-bold text-red-600">
                {wedding.photoGroups.filter(g => g.priority === 'Must-have').length}
              </div>
            </div>
            <div>
              <div className="text-neutral-600">Nice-to-Have</div>
              <div className="text-xl font-bold text-green-600">
                {wedding.photoGroups.filter(g => g.priority === 'Nice-to-have').length}
              </div>
            </div>
          </div>
        </div>

        {/* Shot List */}
        {wedding.photoGroups.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            No photo groups have been created yet.
          </div>
        ) : (
          <div className="space-y-4">
            {wedding.photoGroups.map((group, index) => {
              const peopleNames = group.people.map(p => {
                if (p.personId === 'bride') return wedding.brideName
                if (p.personId === 'groom') return wedding.groomName
                return wedding.people.find(person => person.id === p.personId)?.fullName ?? '?'
              })
              
              // Add page break every 8 groups
              const shouldBreak = index > 0 && index % 8 === 0
              
              return (
                <div 
                  key={group.id} 
                  className={`card border-2 ${shouldBreak ? 'print-break' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Order Number */}
                    <div className="flex-shrink-0 w-14 h-14 rounded-full border-2 border-neutral-900 flex items-center justify-center font-bold text-2xl">
                      {group.orderNum}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-bold text-xl text-neutral-900">
                          {group.groupName}
                        </h3>
                        <div className="flex gap-2 flex-shrink-0">
                          <span className={`badge text-xs ${
                            group.side === 'Bride' ? 'badge-bride' :
                            group.side === 'Groom' ? 'badge-groom' :
                            'badge-mixed'
                          }`}>
                            {group.side}
                          </span>
                          <span className={`badge text-xs ${
                            group.priority === 'Must-have' ? 'badge-must' : 'badge-nice'
                          }`}>
                            {group.priority}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-neutral-800 mb-2">
                        <strong className="text-sm text-neutral-600">People:</strong> {peopleNames.join(', ')}
                      </div>
                      
                      {group.notes && (
                        <div className="text-sm text-neutral-700 bg-neutral-50 px-3 py-2 rounded border border-neutral-200 mb-3">
                          <strong>Note:</strong> {group.notes}
                        </div>
                      )}
                      
                      {/* Checkbox for marking complete */}
                      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-200">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="w-5 h-5 border-2 border-neutral-400 rounded" />
                          <span className="text-sm text-neutral-600">Complete</span>
                        </label>
                        <div className="text-xs text-neutral-400">
                          Status: {group.status}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-neutral-300 text-center text-sm text-neutral-500">
          <p>Generated by Family Photo Builder</p>
          <p className="mt-1">Check off each group as you complete it</p>
        </div>
      </div>
    </>
  )
}
