// Auto-generates smart photo group suggestions based on family structure

type Person = {
  id: string
  fullName: string
  side: string
  relationship: string
}

type Wedding = {
  id: string
  brideName: string
  groomName: string
}

export function generateSmartGroups(wedding: Wedding, people: Person[]) {
  const groups: Array<{
    name: string
    side: string
    priority: string
    peopleIds: string[]
  }> = []

  const brideSide = people.filter(p => p.side === 'Bride')
  const groomSide = people.filter(p => p.side === 'Groom')

  // Helper functions
  const findByRel = (side: string, ...rels: string[]) =>
    people.filter(p => p.side === side && rels.includes(p.relationship))

  const brideMom = findByRel('Bride', 'Mom', 'Step Mom')
  const brideDad = findByRel('Bride', 'Dad', 'Step Dad')
  const brideParents = [...brideMom, ...brideDad]
  const brideSiblings = findByRel('Bride', 'Sibling', 'Sibling Spouse/Partner')
  const brideGrandparents = findByRel('Bride', 'Grandparent')

  const groomMom = findByRel('Groom', 'Mom', 'Step Mom')
  const groomDad = findByRel('Groom', 'Dad', 'Step Dad')
  const groomParents = [...groomMom, ...groomDad]
  const groomSiblings = findByRel('Groom', 'Sibling', 'Sibling Spouse/Partner')
  const groomGrandparents = findByRel('Groom', 'Grandparent')

  // CORE SHOTS - Always included
  
  // Couple + Parents (each side)
  if (brideParents.length > 0) {
    groups.push({
      name: `Couple + ${wedding.brideName}'s Parents`,
      side: 'Bride',
      priority: 'Must-have',
      peopleIds: ['bride', 'groom', ...brideParents.map(p => p.id)]
    })
  }

  if (groomParents.length > 0) {
    groups.push({
      name: `Couple + ${wedding.groomName}'s Parents`,
      side: 'Groom',
      priority: 'Must-have',
      peopleIds: ['bride', 'groom', ...groomParents.map(p => p.id)]
    })
  }

  // Couple + Both Parents
  if (brideParents.length > 0 && groomParents.length > 0) {
    groups.push({
      name: 'Couple + Both Sets of Parents',
      side: 'Mixed',
      priority: 'Must-have',
      peopleIds: ['bride', 'groom', ...brideParents.map(p => p.id), ...groomParents.map(p => p.id)]
    })
  }

  // Just Parents (each side individually)
  if (brideMom.length > 0) {
    groups.push({
      name: `${wedding.brideName} + ${wedding.brideName}'s Mom`,
      side: 'Bride',
      priority: 'Must-have',
      peopleIds: ['bride', ...brideMom.map(p => p.id)]
    })
  }

  if (brideDad.length > 0) {
    groups.push({
      name: `${wedding.brideName} + ${wedding.brideName}'s Dad`,
      side: 'Bride',
      priority: 'Must-have',
      peopleIds: ['bride', ...brideDad.map(p => p.id)]
    })
  }

  if (groomMom.length > 0) {
    groups.push({
      name: `${wedding.groomName} + ${wedding.groomName}'s Mom`,
      side: 'Groom',
      priority: 'Must-have',
      peopleIds: ['groom', ...groomMom.map(p => p.id)]
    })
  }

  if (groomDad.length > 0) {
    groups.push({
      name: `${wedding.groomName} + ${wedding.groomName}'s Dad`,
      side: 'Groom',
      priority: 'Must-have',
      peopleIds: ['groom', ...groomDad.map(p => p.id)]
    })
  }

  // GRANDPARENTS
  if (brideGrandparents.length > 0) {
    groups.push({
      name: `Couple + ${wedding.brideName}'s Grandparents`,
      side: 'Bride',
      priority: 'Must-have',
      peopleIds: ['bride', 'groom', ...brideGrandparents.map(p => p.id)]
    })

    groups.push({
      name: `${wedding.brideName} + ${wedding.brideName}'s Grandparents`,
      side: 'Bride',
      priority: 'Nice-to-have',
      peopleIds: ['bride', ...brideGrandparents.map(p => p.id)]
    })
  }

  if (groomGrandparents.length > 0) {
    groups.push({
      name: `Couple + ${wedding.groomName}'s Grandparents`,
      side: 'Groom',
      priority: 'Must-have',
      peopleIds: ['bride', 'groom', ...groomGrandparents.map(p => p.id)]
    })

    groups.push({
      name: `${wedding.groomName} + ${wedding.groomName}'s Grandparents`,
      side: 'Groom',
      priority: 'Nice-to-have',
      peopleIds: ['groom', ...groomGrandparents.map(p => p.id)]
    })
  }

  // All Grandparents
  if (brideGrandparents.length > 0 && groomGrandparents.length > 0) {
    groups.push({
      name: 'Couple + All Grandparents',
      side: 'Mixed',
      priority: 'Nice-to-have',
      peopleIds: ['bride', 'groom', ...brideGrandparents.map(p => p.id), ...groomGrandparents.map(p => p.id)]
    })
  }

  // PARENTS + GRANDPARENTS
  if (brideParents.length > 0 && brideGrandparents.length > 0) {
    groups.push({
      name: `Couple + ${wedding.brideName}'s Parents & Grandparents`,
      side: 'Bride',
      priority: 'Nice-to-have',
      peopleIds: ['bride', 'groom', ...brideParents.map(p => p.id), ...brideGrandparents.map(p => p.id)]
    })
  }

  if (groomParents.length > 0 && groomGrandparents.length > 0) {
    groups.push({
      name: `Couple + ${wedding.groomName}'s Parents & Grandparents`,
      side: 'Groom',
      priority: 'Nice-to-have',
      peopleIds: ['bride', 'groom', ...groomParents.map(p => p.id), ...groomGrandparents.map(p => p.id)]
    })
  }

  // All Parents + All Grandparents
  if (brideParents.length > 0 && groomParents.length > 0 && 
      brideGrandparents.length > 0 && groomGrandparents.length > 0) {
    groups.push({
      name: 'Couple + All Parents & Grandparents',
      side: 'Mixed',
      priority: 'Nice-to-have',
      peopleIds: [
        'bride', 'groom',
        ...brideParents.map(p => p.id),
        ...groomParents.map(p => p.id),
        ...brideGrandparents.map(p => p.id),
        ...groomGrandparents.map(p => p.id)
      ]
    })
  }

  // SIBLINGS
  if (brideSiblings.length > 0) {
    groups.push({
      name: `Couple + ${wedding.brideName}'s Siblings`,
      side: 'Bride',
      priority: 'Must-have',
      peopleIds: ['bride', 'groom', ...brideSiblings.map(p => p.id)]
    })

    groups.push({
      name: `${wedding.brideName} + ${wedding.brideName}'s Siblings`,
      side: 'Bride',
      priority: 'Nice-to-have',
      peopleIds: ['bride', ...brideSiblings.map(p => p.id)]
    })
  }

  if (groomSiblings.length > 0) {
    groups.push({
      name: `Couple + ${wedding.groomName}'s Siblings`,
      side: 'Groom',
      priority: 'Must-have',
      peopleIds: ['bride', 'groom', ...groomSiblings.map(p => p.id)]
    })

    groups.push({
      name: `${wedding.groomName} + ${wedding.groomName}'s Siblings`,
      side: 'Groom',
      priority: 'Nice-to-have',
      peopleIds: ['groom', ...groomSiblings.map(p => p.id)]
    })
  }

  // All Siblings
  if (brideSiblings.length > 0 && groomSiblings.length > 0) {
    groups.push({
      name: 'Couple + All Siblings',
      side: 'Mixed',
      priority: 'Nice-to-have',
      peopleIds: ['bride', 'groom', ...brideSiblings.map(p => p.id), ...groomSiblings.map(p => p.id)]
    })
  }

  // EXTENDED FAMILY (if present)
  const brideExtended = findByRel('Bride', 'Aunt/Uncle', 'Cousin')
  const groomExtended = findByRel('Groom', 'Aunt/Uncle', 'Cousin')

  if (brideExtended.length > 0) {
    groups.push({
      name: `Couple + ${wedding.brideName}'s Extended Family`,
      side: 'Bride',
      priority: 'Nice-to-have',
      peopleIds: ['bride', 'groom', ...brideExtended.map(p => p.id)]
    })
  }

  if (groomExtended.length > 0) {
    groups.push({
      name: `Couple + ${wedding.groomName}'s Extended Family`,
      side: 'Groom',
      priority: 'Nice-to-have',
      peopleIds: ['bride', 'groom', ...groomExtended.map(p => p.id)]
    })
  }

  // FULL FAMILY (everyone)
  if (brideSide.length > 0) {
    groups.push({
      name: `Couple + All ${wedding.brideName}'s Family`,
      side: 'Bride',
      priority: 'Nice-to-have',
      peopleIds: ['bride', 'groom', ...brideSide.map(p => p.id)]
    })
  }

  if (groomSide.length > 0) {
    groups.push({
      name: `Couple + All ${wedding.groomName}'s Family`,
      side: 'Groom',
      priority: 'Nice-to-have',
      peopleIds: ['bride', 'groom', ...groomSide.map(p => p.id)]
    })
  }

  // EVERYONE
  if (brideSide.length > 0 && groomSide.length > 0) {
    groups.push({
      name: 'Couple + Everyone',
      side: 'Mixed',
      priority: 'Nice-to-have',
      peopleIds: ['bride', 'groom', ...people.map(p => p.id)]
    })
  }

  return groups
}
