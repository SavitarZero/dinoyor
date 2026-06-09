'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { relistListing } from '@/lib/actions/listings'

export function RelistButton({ listingId, disabled }: { listingId: string; disabled?: boolean }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    if (loading) return
    setLoading(true)
    setError('')
    const result = await relistListing(listingId)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setShowModal(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled}
        title={disabled ? 'Cannot relist while order is in progress' : undefined}
        className="w-full py-1.5 rounded border border-green-700/40 text-green-400 text-xs font-medium text-center hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Relist
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !loading && setShowModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div>
              <p className="text-white text-sm font-bold">Relist this item?</p>
              <p className="text-gray-400 text-xs mt-1">This will set the listing back to active and make it visible on the market.</p>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Relisting...' : 'Confirm'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg border border-border text-gray-400 text-xs font-bold hover:text-white hover:border-gray-500 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
