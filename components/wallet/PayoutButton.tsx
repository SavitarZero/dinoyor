'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { requestPayout } from '@/lib/actions/payouts'

interface Props {
  currency: string
  amount: number
  minWithdraw: number
}

const GAS_FEE = 1.5 // estimated gas fee in USDT

export function PayoutButton({ currency, amount, minWithdraw }: Props) {
  const router = useRouter()
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const netAmount = Math.max(0, amount - GAS_FEE)

  async function handleConfirm() {
    if (loading) return
    setLoading(true)
    setError('')
    const result = await requestPayout(currency)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    setSubmitted(true)
    setShowModal(false)
    router.refresh()
  }

  if (submitted) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
          <p className="text-green-400 text-sm font-medium">Payout request submitted</p>
        </div>
        <p className="text-gray-500 text-xs">Your next payout request will be available after this one is processed by admin.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 transition-colors"
        >
          Request Payout
        </button>
        <p className="text-gray-500 text-xs">Min withdrawal: {minWithdraw} AMO</p>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => !loading && setShowModal(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div>
              <p className="text-white text-sm font-bold">Confirm Payout Request</p>
              <p className="text-gray-400 text-xs mt-1">Withdrawal breakdown:</p>
            </div>

            <div className="rounded-lg border border-border bg-background p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">Amount</span>
                <span className="text-white text-sm font-medium">{amount.toFixed(2)} USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-xs">Gas fee (approx.)</span>
                <span className="text-red-400 text-sm font-medium">-{GAS_FEE.toFixed(2)} USDT</span>
              </div>
              <div className="border-t border-border pt-2 flex items-center justify-between">
                <span className="text-gray-400 text-xs font-medium">You'll receive ~</span>
                <span className="text-green-400 text-sm font-bold">≈ {netAmount.toFixed(2)} USDT</span>
              </div>
            </div>

            <p className="text-gray-600 text-[10px]">Gas fee is an estimate and may vary at the time of processing.</p>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-green-500 text-white text-xs font-bold hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Processing…' : 'Confirm Withdrawal'}
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
