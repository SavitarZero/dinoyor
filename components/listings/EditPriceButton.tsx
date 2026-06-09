'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateListingPrice } from '@/lib/actions/listings'

const FEE_PCT = 5
const FLAT_FEE = 1

export function EditPriceButton({ listingId, currentPrice, status }: { listingId: string; currentPrice: number; status: string }) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [price, setPrice] = useState(String(currentPrice))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleClick() {
    if (status !== 'cancelled') {
      setError('cancel_required')
      setShowModal(true)
      return
    }
    setError('')
    setPrice(String(currentPrice))
    setShowModal(true)
  }

  async function handleSave() {
    if (loading) return
    const num = parseFloat(price)
    if (!num || num <= 0) { setError('Price must be greater than 0'); return }
    setLoading(true)
    setError('')
    const result = await updateListingPrice(listingId, num)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setShowModal(false)
    router.refresh()
  }

  const priceNum = parseFloat(price) || 0
  const percentFee = priceNum * FEE_PCT / 100
  const totalFee = percentFee + FLAT_FEE
  const youReceive = Math.max(0, priceNum - totalFee)

  return (
    <>
      <button
        onClick={handleClick}
        className="w-full py-1.5 rounded border border-border text-gray-400 text-xs font-medium text-center hover:text-white hover:border-gray-500 transition-colors"
      >
        Edit Price
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !loading && setShowModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4">

            {error === 'cancel_required' ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  </div>
                  <p className="text-white text-sm font-semibold">Cannot edit price</p>
                </div>
                <p className="text-gray-400 text-xs">You must cancel the listing before editing the price.</p>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 rounded-lg border border-border text-gray-400 text-xs font-bold hover:text-white hover:border-gray-500 transition-colors"
                >
                  Close
                </button>
              </>
            ) : (
              <>
                <p className="text-white text-sm font-bold">Edit Price</p>

                {error && error !== 'cancel_required' && <p className="text-red-400 text-xs">{error}</p>}

                <div>
                  <label className="block text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5">New price (AMO)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm font-mono focus:outline-none focus:border-focus-border transition-colors"
                  />
                </div>

                {priceNum > 0 && (
                  <div className="rounded-lg bg-background border border-border p-3 space-y-1.5 text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>Price</span>
                      <span>{priceNum.toFixed(2)} AMO</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Platform fee ({FEE_PCT}% + {FLAT_FEE} AMO)</span>
                      <span>−{totalFee.toFixed(2)} AMO</span>
                    </div>
                    <div className="border-t border-border pt-1.5 flex justify-between font-semibold">
                      <span className="text-white">You receive</span>
                      <span className="text-accent-gold">{youReceive.toFixed(2)} AMB</span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={loading || priceNum <= 0}
                    className="px-4 py-1.5 rounded-lg bg-success text-black text-xs font-bold hover:bg-success-hover disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                    className="px-4 py-1.5 rounded-lg border border-border text-gray-400 text-xs font-bold hover:text-white hover:border-gray-500 disabled:opacity-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
