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
    <div>
      <button
        onClick={handleRemove}
        disabled={loading}
        className="px-3 py-1.5 rounded border border-red-700/40 text-red-400 text-xs font-medium hover:bg-red-900/20 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Removing...' : 'Remove'}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}
