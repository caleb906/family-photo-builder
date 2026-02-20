'use client'

import { useState, useRef, useEffect } from 'react'

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

export function SearchableRelationship({ 
  name = "relationship",
  value = "",
  required = true 
}: { 
  name?: string
  value?: string
  required?: boolean
}) {
  const [search, setSearch] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [filtered, setFiltered] = useState(RELATIONSHIPS)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (search) {
      const results = RELATIONSHIPS.filter(rel =>
        rel.toLowerCase().includes(search.toLowerCase())
      )
      setFiltered(results)
    } else {
      setFiltered(RELATIONSHIPS)
    }
  }, [search])

  const handleSelect = (rel: string) => {
    setSearch(rel)
    setIsOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <input
        type="text"
        name={name}
        value={search}
        onChange={(e) => {
          setSearch(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        required={required}
        className="input"
        placeholder="Type or select..."
        autoComplete="off"
      />
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length > 0 ? (
            filtered.map((rel) => (
              <button
                key={rel}
                type="button"
                onClick={() => handleSelect(rel)}
                className="w-full text-left px-4 py-2 hover:bg-primary-50 transition-colors"
              >
                {rel}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-neutral-500">
              No matches - will use "{search}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
