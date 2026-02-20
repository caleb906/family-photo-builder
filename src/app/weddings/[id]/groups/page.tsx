import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { AddCoupleButton } from '@/components/AddCoupleButton'
import { DeleteGroupButton } from '@/components/DeleteGroupButton'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function addGroup(formData: FormData) {
  'use server'
  const weddingId = formData.get('weddingId') as string
  const groupName = formData.get('groupName') as string
  const side = formData.get('side') as string
  const priority = formData.get('priority') as string
  const notes = formData.get('notes') as string
  const peopleIds = formData.getAll('people[]') as string[]
  
  const maxOrder = await prisma.photoGroup.findFirst({
    where: { weddingId },
    orderBy: { orderNum: 'desc' },
    select: { orderNum: true },
  })
  
  const newOrder = (maxOrder?.orderNum ?? 0) + 1
  
  await prisma.photoGroup.create({
    data: {
      groupName,
      side,
      priority,
      orderNum: newOrder,
      notes: notes || null,
      weddingId,
      people: {
        create: peopleIds.map((personId) => ({
          personId,
        })),
      },
    },
  })
  
  revalidatePath(`/weddings/${weddingId}/groups`)
}

async function deleteGroup(formData: FormData) {
  'use server'
  const groupId = formData.get('groupId') as string
  const weddingId = formData.get('weddingId') as string

  await prisma.photoGroup.delete({
    where: { id: groupId },
  })
  revalidatePath(`/weddings/${weddingId}/groups`)
}

async function duplicateGroup(formData: FormData) {
  'use server'
  const groupId = formData.get('groupId') as string
  const weddingId = formData.get('weddingId') as string
  
  const original = await prisma.photoGroup.findUnique({
    where: { id: groupId },
    include: { people: true },
  })
  
  if (!original) return
  
  const maxOrder = await prisma.photoGroup.findFirst({
    where: { weddingId },
    orderBy: { orderNum: 'desc' },
    select: { orderNum: true },
  })
  
  await prisma.photoGroup.create({
    data: {
      groupName: `${original.groupName} (Copy)`,
      side: original.side,
      priority: original.priority,
      orderNum: (maxOrder?.orderNum ?? 0) + 1,
      notes: original.notes,
      status: 'Not Ready',
      weddingId,
      people: {
        create: original.people.map((p) => ({
          personId: p.personId,
        })),
      },
    },
  })
  
  revalidatePath(`/weddings/${weddingId}/groups`)
}

async function moveGroup(formData: FormData) {
  'use server'
  const groupId = formData.get('groupId') as string
  const weddingId = formData.get('weddingId') as string
  const direction = formData.get('direction') as string
  
  const group = await prisma.photoGroup.findUnique({
    where: { id: groupId },
  })
  
  if (!group) return
  
  if (direction === 'up') {
    const prevGroup = await prisma.photoGroup.findFirst({
      where: {
        weddingId,
        orderNum: { lt: group.orderNum },
      },
      orderBy: { orderNum: 'desc' },
    })
    
    if (prevGroup) {
      await prisma.$transaction([
        prisma.photoGroup.update({
          where: { id: group.id },
          data: { orderNum: prevGroup.orderNum },
        }),
        prisma.photoGroup.update({
          where: { id: prevGroup.id },
          data: { orderNum: group.orderNum },
        }),
      ])
    }
  } else {
    const nextGroup = await prisma.photoGroup.findFirst({
      where: {
        weddingId,
        orderNum: { gt: group.orderNum },
      },
      orderBy: { orderNum: 'asc' },
    })
    
    if (nextGroup) {
      await prisma.$transaction([
        prisma.photoGroup.update({
          where: { id: group.id },
          data: { orderNum: nextGroup.orderNum },
        }),
        prisma.photoGroup.update({
          where: { id: nextGroup.id },
          data: { orderNum: group.orderNum },
        }),
      ])
    }
  }
  
  revalidatePath(`/weddings/${weddingId}/groups`)
}

async function generateSuggestions(formData: FormData) {
  'use server'
  const weddingId = formData.get('weddingId') as string
  
  const wedding = await prisma.wedding.findUnique({
    where: { id: weddingId },
    include: { people: true },
  })
  
  if (!wedding) return
  
  const maxOrder = await prisma.photoGroup.findFirst({
    where: { weddingId },
    orderBy: { orderNum: 'desc' },
    select: { orderNum: true },
  })
  
  let orderNum = (maxOrder?.orderNum ?? 0) + 1
  
  const findPeople = (side: string, relationship: string) => {
    return wedding.people
      .filter(p => p.side === side && p.relationship === relationship)
      .map(p => p.id)
  }
  
  const findAllBySide = (side: string) => {
    return wedding.people.filter(p => p.side === side).map(p => p.id)
  }
  
  const b = wedding.brideName
  const g = wedding.groomName

  const templates = [
    // Bride's side — "Couple" shots include both bride + groom virtual IDs
    { name: `Couple + ${b}'s Parents`,       side: 'Bride', people: ['bride', 'groom', ...findPeople('Bride', 'Mom'), ...findPeople('Bride', 'Dad')] },
    { name: `Couple + ${b}'s Mom`,            side: 'Bride', people: ['bride', 'groom', ...findPeople('Bride', 'Mom')] },
    { name: `Couple + ${b}'s Dad`,            side: 'Bride', people: ['bride', 'groom', ...findPeople('Bride', 'Dad')] },
    { name: `${b} + ${b}'s Mom`,              side: 'Bride', people: ['bride', ...findPeople('Bride', 'Mom')] },
    { name: `${b} + ${b}'s Dad`,              side: 'Bride', people: ['bride', ...findPeople('Bride', 'Dad')] },
    { name: `Couple + ${b}'s Siblings`,       side: 'Bride', people: ['bride', 'groom', ...findPeople('Bride', 'Sibling')] },
    { name: `${b} + ${b}'s Siblings`,         side: 'Bride', people: ['bride', ...findPeople('Bride', 'Sibling')] },
    { name: `Couple + ${b}'s Grandparents`,   side: 'Bride', people: ['bride', 'groom', ...findPeople('Bride', 'Grandparent')] },
    { name: `Couple + ${b}'s Extended Family`,side: 'Bride', people: ['bride', 'groom', ...findAllBySide('Bride')] },

    // Groom's side
    { name: `Couple + ${g}'s Parents`,       side: 'Groom', people: ['bride', 'groom', ...findPeople('Groom', 'Mom'), ...findPeople('Groom', 'Dad')] },
    { name: `Couple + ${g}'s Mom`,            side: 'Groom', people: ['bride', 'groom', ...findPeople('Groom', 'Mom')] },
    { name: `Couple + ${g}'s Dad`,            side: 'Groom', people: ['bride', 'groom', ...findPeople('Groom', 'Dad')] },
    { name: `${g} + ${g}'s Mom`,              side: 'Groom', people: ['groom', ...findPeople('Groom', 'Mom')] },
    { name: `${g} + ${g}'s Dad`,              side: 'Groom', people: ['groom', ...findPeople('Groom', 'Dad')] },
    { name: `Couple + ${g}'s Siblings`,       side: 'Groom', people: ['bride', 'groom', ...findPeople('Groom', 'Sibling')] },
    { name: `${g} + ${g}'s Siblings`,         side: 'Groom', people: ['groom', ...findPeople('Groom', 'Sibling')] },
    { name: `Couple + ${g}'s Grandparents`,   side: 'Groom', people: ['bride', 'groom', ...findPeople('Groom', 'Grandparent')] },
    { name: `Couple + ${g}'s Extended Family`,side: 'Groom', people: ['bride', 'groom', ...findAllBySide('Groom')] },

    // Mixed
    { name: 'Couple + Both sets of parents',  side: 'Mixed', people: ['bride', 'groom', ...findPeople('Bride', 'Mom'), ...findPeople('Bride', 'Dad'), ...findPeople('Groom', 'Mom'), ...findPeople('Groom', 'Dad')] },
    { name: 'Couple + Immediate families',    side: 'Mixed', people: ['bride', 'groom', ...findAllBySide('Bride'), ...findAllBySide('Groom')] },
  ]
  
  for (const template of templates) {
    if (template.people.length > 0 || template.name.includes('Extended')) {
      await prisma.photoGroup.create({
        data: {
          groupName: template.name,
          side: template.side,
          priority: 'Must-have',
          orderNum: orderNum++,
          status: 'Not Ready',
          weddingId,
          people: {
            create: template.people.map((personId) => ({
              personId,
            })),
          },
        },
      })
    }
  }
  
  revalidatePath(`/weddings/${weddingId}/groups`)
}

export default async function PhotoGroupsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  
  const wedding = await prisma.wedding.findUnique({
    where: { id },
    include: {
      people: {
        orderBy: { fullName: 'asc' },
      },
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

  const virtualPeople = [
    { id: 'bride', name: wedding.brideName, side: 'Bride' },
    { id: 'groom', name: wedding.groomName, side: 'Groom' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/30 to-neutral-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <Link href={`/weddings/${wedding.id}`} className="text-neutral-600 hover:text-neutral-900 inline-flex items-center gap-2 mb-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to dashboard
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 mb-2">Photo Groups</h1>
              <p className="text-neutral-600">Build your shot list</p>
            </div>
            {wedding.people.length > 0 && (
              <form action={generateSuggestions} method="post">
                <input type="hidden" name="weddingId" value={wedding.id} />
                <button type="submit" className="btn btn-secondary">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Suggested Groups
                </button>
              </form>
            )}
          </div>
        </div>

        {wedding.people.length === 0 && (
          <div className="card text-center py-12 mb-8 animate-slide-up">
            <div className="text-neutral-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-700 mb-2">No people added yet</h3>
            <p className="text-neutral-500 mb-4">Add people first before creating photo groups</p>
            <Link href={`/weddings/${wedding.id}/people`} className="btn btn-primary">
              Add People
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {wedding.people.length > 0 && (
            <div className="animate-slide-up">
              <form action={addGroup} className="card sticky top-4">
                <h2 className="text-xl font-semibold text-neutral-900 mb-6">Add New Group</h2>
                
                <input type="hidden" name="weddingId" value={wedding.id} />
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="groupName" className="label">Group Name *</label>
                    <input
                      type="text"
                      id="groupName"
                      name="groupName"
                      required
                      className="input"
                      placeholder="e.g., Couple + Bride's Parents"
                    />
                  </div>

                  <div>
                    <label className="label">People in Photo *</label>
                    
                    <div className="flex gap-2 mb-3">
                      <AddCoupleButton />
                    </div>
                    
                    <div className="border border-neutral-300 rounded-lg p-4 max-h-64 overflow-y-auto bg-white">
                      {virtualPeople.map((person) => (
                        <label
                          key={person.id}
                          className="flex items-center gap-2 py-2 px-2 hover:bg-neutral-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            id={`person-${person.id}`}
                            name="people[]"
                            value={person.id}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="flex-1 font-medium">{person.name}</span>
                          <span className={`badge ${person.side === 'Bride' ? 'badge-bride' : 'badge-groom'}`}>
                            {person.side}
                          </span>
                        </label>
                      ))}
                      
                      {wedding.people.length > 0 && (
                        <div className="border-t border-neutral-200 my-2"></div>
                      )}
                      
                      {wedding.people.map((person) => (
                        <label
                          key={person.id}
                          className="flex items-center gap-2 py-2 px-2 hover:bg-neutral-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            name="people[]"
                            value={person.id}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                          />
                          <span className="flex-1">
                            <span className="font-medium">{person.fullName}</span>
                            <span className="text-sm text-neutral-500 ml-2">({person.relationship})</span>
                          </span>
                          <span className={`badge ${person.side === 'Bride' ? 'badge-bride' : 'badge-groom'}`}>
                            {person.side}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="side" className="label">Side *</label>
                      <select id="side" name="side" required className="input">
                        <option value="Bride">Bride</option>
                        <option value="Groom">Groom</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="priority" className="label">Priority *</label>
                      <select id="priority" name="priority" required className="input">
                        <option value="Must-have">Must-have</option>
                        <option value="Nice-to-have">Nice-to-have</option>
                      </select>
                    </div>
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

                  <button type="submit" className="btn btn-primary w-full">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4 animate-slide-up animate-delay-100">
            <h2 className="text-xl font-semibold text-neutral-900 flex items-center gap-2">
              Current Groups
              <span className="text-sm font-normal text-neutral-500">
                {wedding.photoGroups.length} {wedding.photoGroups.length === 1 ? 'group' : 'groups'}
              </span>
            </h2>
            
            {wedding.photoGroups.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-neutral-500">No groups created yet</p>
              </div>
            ) : (
              wedding.photoGroups.map((group, index) => {
                const peopleNames = group.people.map(p => {
                  if (p.personId === 'bride') return wedding.brideName
                  if (p.personId === 'groom') return wedding.groomName
                  return p.person.fullName
                })
                
                const hasBrideOrGroom = group.people.some(p => 
                  p.personId === 'bride' || p.personId === 'groom'
                )
                
                return (
                  <div key={group.id} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-neutral-500 font-mono text-sm">#{group.orderNum}</span>
                          <h3 className="font-semibold text-neutral-900">{group.groupName}</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`badge badge-${group.side.toLowerCase()}`}>
                            {group.side}
                          </span>
                          <span className={`badge ${group.priority === 'Must-have' ? 'badge-must' : 'badge-nice'}`}>
                            {group.priority}
                          </span>
                          <span className={`badge badge-status-${group.status.toLowerCase().replace(' ', '')}`}>
                            {group.status}
                          </span>
                        </div>
                        <div className="text-sm text-neutral-600">
                          <strong>People:</strong> {peopleNames.join(', ') || 'None selected'}
                        </div>
                        {!hasBrideOrGroom && group.people.length > 0 && (
                          <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Warning: No bride or groom in this group
                          </div>
                        )}
                        {group.notes && (
                          <div className="text-xs text-neutral-500 mt-2 bg-neutral-50 px-2 py-1 rounded">
                            {group.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-neutral-100">
                      <form action={moveGroup} method="post" className="inline">
                        <input type="hidden" name="groupId" value={group.id} />
                        <input type="hidden" name="weddingId" value={wedding.id} />
                        <input type="hidden" name="direction" value="up" />
                        <button
                          type="submit"
                          disabled={index === 0}
                          className="btn btn-ghost btn-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                      </form>
                      
                      <form action={moveGroup} method="post" className="inline">
                        <input type="hidden" name="groupId" value={group.id} />
                        <input type="hidden" name="weddingId" value={wedding.id} />
                        <input type="hidden" name="direction" value="down" />
                        <button
                          type="submit"
                          disabled={index === wedding.photoGroups.length - 1}
                          className="btn btn-ghost btn-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </form>
                      
                      <form action={duplicateGroup} method="post" className="inline">
                        <input type="hidden" name="groupId" value={group.id} />
                        <input type="hidden" name="weddingId" value={wedding.id} />
                        <button type="submit" className="btn btn-ghost btn-sm">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Duplicate
                        </button>
                      </form>
                      
                      <DeleteGroupButton
                        groupId={group.id}
                        weddingId={wedding.id}
                        deleteAction={deleteGroup}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
