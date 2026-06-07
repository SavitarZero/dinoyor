'use client'
import { useState } from 'react'
import { createOrder } from '@/lib/actions/orders'

export function BuyButton({ listingId }: { listingId: string }) {
  const [step, setStep]       = useState<'idle' | 'confirm' | 'loading'>('idle')

  async function handleConfirm() {
    setStep('loading')
    await createOrder(listingId)
  }

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
              An order will be created. You'll receive payment instructions to send funds to escrow.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setStep('idle')}
            className="flex-1 py-2.5 rounded-xl border border-border text-gray-400 text-sm font-medium hover:text-white hover:border-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-accent text-black text-sm font-bold hover:opacity-90 transition-opacity"
          >
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
        Creating order...
      </button>
    )
  }

  return (
    <button
      onClick={() => setStep('confirm')}
      className="w-full py-3 rounded-xl bg-accent text-black font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      Buy Now
    </button>
  )
}
