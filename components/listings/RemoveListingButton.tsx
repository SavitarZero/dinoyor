'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cancelListing } from '@/lib/actions/listings'

export function RemoveListingButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRemove() {
    if (loading) return
    setLoading(true)
    setError('')
    const result = await cancelListing(listingId)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
  }

  return (
    <>
      <button
        onClick={handleRemove}
        disabled={loading}
        className="px-3 py-1.5 rounded border border-red-700/40 text-red-400 text-xs font-medium hover:bg-red-900/20 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Cancelling...' : 'Cancel'}
      </button>

      {error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setError('')} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-white text-sm font-semibold">Cannot cancel listing</p>
            </div>
            <p className="text-gray-400 text-xs">{error}</p>
            <button
              onClick={() => setError('')}
              className="px-4 py-1.5 rounded-lg border border-border text-gray-400 text-xs font-bold hover:text-white hover:border-gray-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}
