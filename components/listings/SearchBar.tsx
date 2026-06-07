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
    router.push(`/market?${sp.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mb-6">
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search items..."
        className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-border text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent transition-colors"
      />
      <div className="flex gap-2">
        <select
          defaultValue={params.get('currency') ?? ''}
          onChange={e => {
            const sp = new URLSearchParams(params.toString())
            if (e.target.value) sp.set('currency', e.target.value)
            else sp.delete('currency')
            router.push(`/market?${sp.toString()}`)
          }}
          className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl bg-surface border border-border text-white text-sm focus:outline-none focus:border-accent"
        >
          <option value="">All currencies</option>
          <option value="USDT">USDT</option>
          <option value="ETH">ETH</option>
          <option value="BTC">BTC</option>
        </select>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-accent text-black text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </div>
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
