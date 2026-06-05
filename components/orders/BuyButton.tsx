'use client'
import { useState } from 'react'
import { createOrder } from '@/lib/actions/orders'

export function BuyButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    await createOrder(listingId)
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full py-3 rounded-lg bg-accent text-black font-semibold hover:opacity-90 disabled:opacity-50"
    >
      {loading ? 'Processing...' : 'Buy Now'}
    </button>
  )
}
