import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function WeddingDashboardPage({
  params,
}: {
  params: { id: string }
}) {
  const wedding = await prisma.wedding.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          people: true,
          photoGroups: true
        }
      },
      photoGroups: {
        select: {
          status: true
        }
      }
    },
  })

  if (!wedding) {
    notFound()
  }

  const statusCounts = {
    notReady: wedding.photoGroups.filter(g => g.status === 'Not Ready').length,
    ready: wedding.photoGroups.filter(g => g.status === 'Ready').length,
    shot: wedding.photoGroups.filter(g => g.status === 'Shot').length,
  }

  const cards = [
    {
      title: 'People',
      description: 'Add family members and friends',
      href: `/weddings/${wedding.id}/people`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      count: wedding._count.people,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Photo Groups',
      description: 'Build your shot list',
      href: `/weddings/${wedding.id}/groups`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      count: wedding._count.photoGroups,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Shot List',
      description: 'View organized list for wedding day',
      href: `/weddings/${wedding.id}/shotlist`,
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      count: statusCounts.shot,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-100">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Link href="/" className="text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-2 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to all weddings
          </Link>
          
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-2">
              {wedding.brideName} & {wedding.groomName}
            </h1>
            {wedding.weddingDate && (
              <p className="text-lg text-neutral-600">
                {new Date(wedding.weddingDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            )}
            {wedding.notes && (
              <p className="text-neutral-600 mt-2 bg-primary-50 px-4 py-3 rounded-lg border border-primary-100 inline-block">
                {wedding.notes}
              </p>
            )}
          </div>
        </div>

        {/* Stats Overview */}
        {wedding._count.photoGroups > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-up">
            <div className="card text-center">
              <div className="text-3xl font-bold text-neutral-400">{statusCounts.notReady}</div>
              <div className="text-sm text-neutral-600 mt-1">Not Ready</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-yellow-600">{statusCounts.ready}</div>
              <div className="text-sm text-neutral-600 mt-1">Ready</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-emerald-600">{statusCounts.shot}</div>
              <div className="text-sm text-neutral-600 mt-1">Shot</div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {cards.map((card, index) => (
            <Link
              key={card.title}
              href={card.href}
              className="card hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`${card.bgColor} ${card.color} w-16 h-16 rounded-lg flex items-center justify-center mb-4`}>
                {card.icon}
              </div>
              <h2 className="text-2xl font-semibold text-neutral-900 mb-2">{card.title}</h2>
              <p className="text-neutral-600 mb-4">{card.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                <span className="text-sm font-medium text-neutral-500">
                  {card.count} {card.count === 1 ? 'item' : 'items'}
                </span>
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="card animate-slide-up animate-delay-300">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <Link href={`/weddings/${wedding.id}/people`} className="btn btn-secondary btn-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add People
            </Link>
            <Link href={`/weddings/${wedding.id}/groups`} className="btn btn-secondary btn-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Groups
            </Link>
            <Link href={`/weddings/${wedding.id}/shotlist`} className="btn btn-secondary btn-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Shot List
            </Link>
            <Link href={`/weddings/${wedding.id}/print`} className="btn btn-secondary btn-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print List
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
