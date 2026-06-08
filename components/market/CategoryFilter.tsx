'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Category {
  id: string
  name: string
}

interface Props {
  categories: Category[]
  activeCat: string | null
  filterParams: Record<string, string | undefined>
}

function buildHref(filterParams: Record<string, string | undefined>, catId: string) {
  const merged = { ...filterParams, cat: catId }
  const qs = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join('&')
  return `/market${qs ? `?${qs}` : ''}`
}

export function CategoryFilter({ categories, activeCat, filterParams }: Props) {
  const [q, setQ] = useState('')

  const filtered = q.trim()
    ? categories.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
    : categories

  return (
    <div>
      <div className="relative mb-2">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search category..."
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
        />
        {q && (
          <button
            onClick={() => setQ('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-0.5 max-h-72 overflow-y-auto scrollbar-none">
        {filtered.length === 0 ? (
          <p className="text-gray-600 text-xs px-3 py-2">No categories found</p>
        ) : (
          filtered.map(cat => (
            <Link
              key={cat.id}
              href={buildHref(filterParams, cat.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors border-l-2 ${
                activeCat === cat.id
                  ? 'text-white bg-white/3 border-accent'
                  : 'text-gray-400 hover:text-white hover:bg-white/2 border-transparent'
              }`}
            >
              <span className="truncate">{cat.name}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
