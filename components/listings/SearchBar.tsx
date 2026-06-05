'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function SearchBarInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const sp = new URLSearchParams(params.toString())
    if (q) sp.set('q', q)
    else sp.delete('q')
    router.push(`/listings?${sp.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search items..."
        className="flex-1 px-4 py-2 rounded-lg bg-surface border border-border text-white focus:outline-none focus:border-accent"
      />
      <select
        defaultValue={params.get('currency') ?? ''}
        onChange={e => {
          const sp = new URLSearchParams(params.toString())
          if (e.target.value) sp.set('currency', e.target.value)
          else sp.delete('currency')
          router.push(`/listings?${sp.toString()}`)
        }}
        className="px-3 py-2 rounded-lg bg-surface border border-border text-white"
      >
        <option value="">All currencies</option>
        <option value="USDT">USDT</option>
        <option value="ETH">ETH</option>
        <option value="BTC">BTC</option>
      </select>
      <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-black font-semibold">
        Search
      </button>
    </form>
  )
}

export function SearchBar() {
  return (
    <Suspense fallback={<div className="h-12 mb-6" />}>
      <SearchBarInner />
    </Suspense>
  )
}
