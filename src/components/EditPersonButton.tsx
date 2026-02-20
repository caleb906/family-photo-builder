'use client'

import { useState } from 'react'

export function EditPersonButton({
  person,
  updateAction
}: {
  person: {
    id: string
    fullName: string
    side: string
    relationship: string
    notes: string | null
    isDivorced: boolean
  }
  updateAction: (formData: FormData) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(person)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    await updateAction(data)
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="btn btn-ghost btn-sm text-blue-600 hover:bg-blue-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 max-w-md w-full">
        <h3 className="text-xl font-semibold mb-4">Edit Person</h3>
        
        <input type="hidden" name="personId" value={person.id} />
        
        <div className="space-y-4">
          <div>
            <label className="label">Full Name *</label>
            <input
              type="text"
              name="fullName"
              defaultValue={formData.fullName}
              required
              className="input"
            />
          </div>

          <div>
            <label className="label">Relationship *</label>
            <input
              type="text"
              name="relationship"
              defaultValue={formData.relationship}
              required
              className="input"
            />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              name="notes"
              defaultValue={formData.notes || ''}
              rows={2}
              className="input"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isDivorced"
              id="edit-isDivorced"
              defaultChecked={formData.isDivorced}
              className="w-4 h-4"
            />
            <label htmlFor="edit-isDivorced" className="text-sm">
              Parents are divorced
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn btn-primary flex-1">
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
