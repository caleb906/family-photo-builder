'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteGroupButton({
  groupId,
  weddingId,
  deleteAction
}: {
  groupId: string
  weddingId: string
  deleteAction: (formData: FormData) => Promise<void>
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    if (!confirm('Delete this group?')) {
      return
    }

    const formData = new FormData()
    formData.append('groupId', groupId)
    formData.append('weddingId', weddingId)

    startTransition(async () => {
      await deleteAction(formData)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50 ml-auto"
    >
      {isPending ? (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
    </button>
  )
}
