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
        className="flex-1 px-4 py-2.5 rounded-xl bg-surface border border-border text-white placeholder-gray-600 text-sm focus:outline-none focus:border-focus-border transition-colors"
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
          className="flex-1 sm:flex-none px-3 py-2.5 rounded bg-background border border-border text-white text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-size-[16px] bg-position-[right_0.75rem_center] bg-no-repeat pr-8 focus:outline-none focus:border-focus-border transition-colors"
        >
          <option value="">All currencies</option>
          <option value="USDT">USDT</option>
          <option value="ETH">ETH</option>
          <option value="BTC">BTC</option>
        </select>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-success text-black text-sm font-bold hover:bg-success-hover transition-colors"
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
