'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createOrder } from '@/lib/actions/orders'

interface Props {
  listingId: string
  price: number
  isLoggedIn: boolean
  buyerBalance: number
}

export function BuyButton({ listingId, price, isLoggedIn, buyerBalance }: Readonly<Props>) {
  const [step, setStep]   = useState<'idle' | 'confirm' | 'loading'>('idle')
  const [error, setError] = useState('')

  async function handleConfirm() {
    setStep('loading')
    setError('')
    const result = await createOrder(listingId)
    if (result?.error) {
      setError(result.error)
      setStep('idle')
    }
  }

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
        Sign in to buy
      </Link>
    )
  }

  const hasBalance = buyerBalance >= price

  if (step === 'confirm') {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <div>
            <p className="text-white font-semibold text-sm">Confirm Purchase</p>
            <p className="text-gray-400 text-xs mt-0.5">
              <span className="text-accent font-bold">{price} coin</span> will be deducted from your balance.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setStep('idle')} className="flex-1 py-2.5 rounded-xl border border-border text-gray-400 text-sm font-medium hover:text-white hover:border-accent transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl bg-accent text-black text-sm font-bold hover:opacity-90 transition-opacity">
            Yes, Buy Now
          </button>
        </div>
      </div>
    )
  }

  if (step === 'loading') {
    return (
      <button disabled className="w-full py-3 rounded-xl bg-accent text-black font-bold flex items-center justify-center gap-2 opacity-80">
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        Creating order…
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <div className={`flex items-center justify-between rounded-xl px-4 py-2.5 border ${
        hasBalance ? 'border-green-700/30 bg-green-950/10' : 'border-yellow-700/30 bg-yellow-950/10'
      }`}>
        <div className="flex items-center gap-2">
          <svg className={`w-3.5 h-3.5 ${hasBalance ? 'text-green-400' : 'text-yellow-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
          </svg>
          <span className="text-xs text-gray-400">Your balance</span>
        </div>
        <span className={`text-sm font-bold ${hasBalance ? 'text-green-400' : 'text-yellow-400'}`}>
          {buyerBalance.toFixed(2)} coin
        </span>
      </div>

      {error && (
        <div className="rounded-xl bg-red-900/20 border border-red-700/50 px-4 py-3 flex gap-2 items-start">
          <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-red-400 text-xs leading-relaxed">{error}</p>
        </div>
      )}

      {hasBalance ? (
        <button
          onClick={() => { setStep('confirm'); setError('') }}
          className="w-full py-3 rounded-xl bg-accent text-black font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Buy Now · {price} coin
        </button>
      ) : (
        <Link
          href="/wallet"
          className="w-full py-3 rounded-xl bg-yellow-500 text-black font-bold text-sm text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Top up wallet to buy
        </Link>
      )}
    </div>
  )
}
