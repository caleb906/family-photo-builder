'use client'

type Person = {
  id: string
  fullName: string
  relationship: string
  side: string
}

export function FamilyTree({
  brideName,
  groomName,
  people
}: {
  brideName: string
  groomName: string
  people: Person[]
}) {
  const brideSide = people.filter(p => p.side === 'Bride')
  const groomSide = people.filter(p => p.side === 'Groom')

  const organizeFamily = (people: Person[]) => {
    return {
      grandparents: people.filter(p => p.relationship === 'Grandparent'),
      parents: people.filter(p => ['Mom', 'Dad', 'Step Mom', 'Step Dad'].includes(p.relationship)),
      siblings: people.filter(p => ['Sibling', 'Sibling Spouse/Partner'].includes(p.relationship)),
      extended: people.filter(p => ['Aunt/Uncle', 'Cousin'].includes(p.relationship)),
      friends: people.filter(p => p.relationship === 'Friend'),
      other: people.filter(p => p.relationship === 'Other'),
    }
  }

  const brideFamily = organizeFamily(brideSide)
  const groomFamily = organizeFamily(groomSide)

  const PersonCard = ({ person }: { person: Person }) => (
    <div className="bg-white border-2 border-neutral-300 rounded-lg p-3 text-center min-w-[120px] shadow-sm hover:shadow-md transition-shadow">
      <div className="font-semibold text-sm text-neutral-900">{person.fullName}</div>
      <div className="text-xs text-neutral-500 mt-1">{person.relationship}</div>
    </div>
  )

  const Section = ({ title, people, color }: { title: string; people: Person[]; color: string }) => {
    if (people.length === 0) return null
    return (
      <div className="mb-6">
        <div className={`text-sm font-semibold ${color} mb-3 flex items-center gap-2`}>
          <div className="h-1 w-8 bg-current rounded"></div>
          {title}
          <div className="h-1 flex-1 bg-current rounded opacity-20"></div>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {people.map(person => <PersonCard key={person.id} person={person} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-center mb-8">Family Tree Overview</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Bride's Side */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-block bg-pink-100 border-4 border-pink-600 rounded-xl p-4 mb-4">
              <div className="text-2xl font-bold text-pink-900">{brideName}</div>
              <div className="text-sm text-pink-700">Bride</div>
            </div>
          </div>

          <Section title="Grandparents" people={brideFamily.grandparents} color="text-purple-600" />
          <Section title="Parents" people={brideFamily.parents} color="text-pink-600" />
          <Section title="Siblings" people={brideFamily.siblings} color="text-rose-600" />
          <Section title="Extended Family" people={brideFamily.extended} color="text-pink-500" />
          <Section title="Friends" people={brideFamily.friends} color="text-pink-400" />
          <Section title="Other" people={brideFamily.other} color="text-neutral-500" />

          {brideSide.length === 0 && (
            <div className="text-center py-8 text-neutral-400">
              No family members added yet
            </div>
          )}
        </div>

        {/* Groom's Side */}
        <div className="space-y-4">
          <div className="text-center">
            <div className="inline-block bg-blue-100 border-4 border-blue-600 rounded-xl p-4 mb-4">
              <div className="text-2xl font-bold text-blue-900">{groomName}</div>
              <div className="text-sm text-blue-700">Groom</div>
            </div>
          </div>

          <Section title="Grandparents" people={groomFamily.grandparents} color="text-purple-600" />
          <Section title="Parents" people={groomFamily.parents} color="text-blue-600" />
          <Section title="Siblings" people={groomFamily.siblings} color="text-sky-600" />
          <Section title="Extended Family" people={groomFamily.extended} color="text-blue-500" />
          <Section title="Friends" people={groomFamily.friends} color="text-blue-400" />
          <Section title="Other" people={groomFamily.other} color="text-neutral-500" />

          {groomSide.length === 0 && (
            <div className="text-center py-8 text-neutral-400">
              No family members added yet
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 pt-6 border-t border-neutral-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-pink-600">{brideSide.length}</div>
            <div className="text-sm text-neutral-600">Bride's Side</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-blue-600">{groomSide.length}</div>
            <div className="text-sm text-neutral-600">Groom's Side</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600">
              {brideFamily.grandparents.length + groomFamily.grandparents.length}
            </div>
            <div className="text-sm text-neutral-600">Grandparents</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-neutral-900">{people.length}</div>
            <div className="text-sm text-neutral-600">Total People</div>
          </div>
        </div>
      </div>

      {/* Missing Check */}
      <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
        <div className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Completeness Check
        </div>
        <div className="text-sm text-neutral-700 space-y-1">
          {brideFamily.parents.length === 0 && <div>• Consider adding {brideName}'s parents</div>}
          {groomFamily.parents.length === 0 && <div>• Consider adding {groomName}'s parents</div>}
          {brideFamily.grandparents.length === 0 && <div>• Consider adding {brideName}'s grandparents (if applicable)</div>}
          {groomFamily.grandparents.length === 0 && <div>• Consider adding {groomName}'s grandparents (if applicable)</div>}
          {brideFamily.siblings.length === 0 && <div>• Consider adding {brideName}'s siblings (if applicable)</div>}
          {groomFamily.siblings.length === 0 && <div>• Consider adding {groomName}'s siblings (if applicable)</div>}
          {brideFamily.parents.length > 0 && brideFamily.grandparents.length > 0 && 
           groomFamily.parents.length > 0 && groomFamily.grandparents.length > 0 && (
            <div className="text-emerald-600 font-semibold">✓ All key family groups covered!</div>
          )}
        </div>
      </div>
    </div>
  )
}
