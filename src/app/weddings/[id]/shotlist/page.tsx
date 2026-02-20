import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

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
  
  redirect(`/weddings/${weddingId}/shotlist`)
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

  if (!wedding) {
    notFound()
  }

  const statusCounts = {
    total: wedding.photoGroups.length,
    notReady: wedding.photoGroups.filter(g => g.status === 'Not Ready').length,
    ready: wedding.photoGroups.filter(g => g.status === 'Ready').length,
    shot: wedding.photoGroups.filter(g => g.status === 'Shot').length,
  }

  const completionPercent = statusCounts.total > 0 
    ? Math.round((statusCounts.shot / statusCounts.total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in no-print">
          <Link href={`/weddings/${wedding.id}`} className="text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-2 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to dashboard
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-1">Shot List</h1>
              <p className="text-neutral-600">
                {wedding.brideName} & {wedding.groomName}
              </p>
            </div>
            <Link 
              href={`/weddings/${wedding.id}/print`}
              className="btn btn-secondary"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print Version
            </Link>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="card mb-6 animate-slide-up no-print">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-neutral-900">Progress</h2>
            <span className="text-2xl font-bold text-primary-600">{completionPercent}%</span>
          </div>
          <div className="w-full h-4 bg-neutral-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 text-center">
            <div>
              <div className="text-2xl font-bold text-neutral-400">{statusCounts.notReady}</div>
              <div className="text-xs text-neutral-600">Not Ready</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.ready}</div>
              <div className="text-xs text-neutral-600">Ready</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">{statusCounts.shot}</div>
              <div className="text-xs text-neutral-600">Shot</div>
            </div>
          </div>
        </div>

        {/* Groups */}
        {wedding.photoGroups.length === 0 ? (
          <div className="card text-center py-12 animate-slide-up">
            <div className="text-neutral-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">No photo groups yet</h3>
            <p className="text-neutral-500 mb-4">Create some groups first</p>
            <Link href={`/weddings/${wedding.id}/groups`} className="btn btn-primary">
              Create Groups
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {wedding.photoGroups.map((group, index) => {
              const peopleNames = group.people.map(p => {
                if (p.personId === 'bride') return wedding.brideName
                if (p.personId === 'groom') return wedding.groomName
                return p.person.fullName
              })
              
              return (
                <div 
                  key={group.id} 
                  className={`card animate-slide-up ${
                    group.status === 'Shot' ? 'bg-emerald-50 border-emerald-200' :
                    group.status === 'Ready' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-white'
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Order Number */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      group.status === 'Shot' ? 'bg-emerald-600 text-white' :
                      group.status === 'Ready' ? 'bg-yellow-500 text-white' :
                      'bg-neutral-200 text-neutral-600'
                    }`}>
                      {group.orderNum}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-semibold text-lg text-neutral-900">
                          {group.groupName}
                        </h3>
                        <div className="flex gap-2 flex-shrink-0">
                          <span className={`badge badge-${group.side.toLowerCase()}`}>
                            {group.side}
                          </span>
                          <span className={`badge ${group.priority === 'Must-have' ? 'badge-must' : 'badge-nice'}`}>
                            {group.priority}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-neutral-700 mb-3">
                        <strong className="text-sm text-neutral-600">People:</strong> {peopleNames.join(', ')}
                      </div>
                      
                      {group.notes && (
                        <div className="text-sm text-neutral-600 bg-white/70 px-3 py-2 rounded border border-neutral-200 mb-3">
                          <strong>Note:</strong> {group.notes}
                        </div>
                      )}
                      
                      {/* Status Buttons */}
                      <form action={updateStatus} method="post" className="no-print">
                        <input type="hidden" name="groupId" value={group.id} />
                        <input type="hidden" name="weddingId" value={wedding.id} />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            name="status"
                            value="Not Ready"
                            className={`btn btn-sm ${
                              group.status === 'Not Ready' 
                                ? 'bg-neutral-600 text-white' 
                                : 'btn-ghost'
                            }`}
                          >
                            Not Ready
                          </button>
                          <button
                            type="submit"
                            name="status"
                            value="Ready"
                            className={`btn btn-sm ${
                              group.status === 'Ready' 
                                ? 'bg-yellow-500 text-white' 
                                : 'btn-ghost'
                            }`}
                          >
                            Ready
                          </button>
                          <button
                            type="submit"
                            name="status"
                            value="Shot"
                            className={`btn btn-sm ${
                              group.status === 'Shot' 
                                ? 'bg-emerald-600 text-white' 
                                : 'btn-ghost'
                            }`}
                          >
                            ✓ Shot
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
