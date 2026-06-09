'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { relistListing } from '@/lib/actions/listings'

export function RelistButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRelist() {
    if (loading) return
    setLoading(true)
    const result = await relistListing(listingId)
    setLoading(false)
    if (!result?.error) router.refresh()
  }

  return (
    <button
      onClick={handleRelist}
      disabled={loading}
      className="w-full py-1.5 rounded border border-green-700/40 text-green-400 text-xs font-medium text-center hover:bg-green-900/20 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Relisting...' : 'Relist'}
    </button>
  )
}
