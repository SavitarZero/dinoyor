'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GameLogo } from '@/components/games/GameImage'

interface Game {
  id: string
  name: string
  slug: string
  logo_url: string | null
}

interface Props {
  games: Game[]
  activeGame: string | null
  filterParams: Record<string, string | undefined>
}

function buildHref(filterParams: Record<string, string | undefined>, slug: string) {
  const merged = { ...filterParams, game: slug }
  const qs = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join('&')
  return `/market${qs ? `?${qs}` : ''}`
}

export function GameFilter({ games, activeGame, filterParams }: Props) {
  const [q, setQ] = useState('')

  const filtered = q.trim()
    ? games.filter(g => g.name.toLowerCase().includes(q.toLowerCase()))
    : games

  return (
    <div>
      <div className="relative mb-2">
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search game..."
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-focus-border transition-colors"
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
          <p className="text-gray-600 text-xs px-3 py-2">No games found</p>
        ) : (
          filtered.map(g => (
            <Link
              key={g.id}
              href={buildHref(filterParams, g.slug)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeGame === g.slug
                  ? 'bg-accent/10 text-accent font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <GameLogo src={g.logo_url} slug={g.slug} name={g.name} className="w-5 h-5 rounded-md shrink-0" />
              <span className="truncate">{g.name}</span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
