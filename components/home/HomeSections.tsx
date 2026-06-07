'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ListingCard } from '@/components/listings/ListingCard'
import type { ListingWithGame, GameWithStats } from '@/lib/types/index'
import { ChevronRight, ChevronLeft, Gamepad2, Sword, TreePine, Crosshair, Coins } from 'lucide-react'
import { GameLogo, GameBanner } from '@/components/games/GameImage'

interface Props {
  games: GameWithStats[]
  byCategory: Record<string, GameWithStats[]>
  listings: ListingWithGame[]
  hotIds: Set<string>
}

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  'MMORPG':                <Sword size={14} />,
  'Survival / Sandbox':    <TreePine size={14} />,
  'Shooter / Skin Market': <Crosshair size={14} />,
  'Blockchain':            <Coins size={14} />,
}

const CATEGORY_ORDER = ['MMORPG', 'Shooter / Skin Market', 'Survival / Sandbox', 'Blockchain']

export function HomeSections({ games, byCategory, listings, hotIds }: Props) {
  const [activeGame, setActiveGame] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [heroIndex, setHeroIndex] = useState(0)

  const categories = CATEGORY_ORDER.filter(c => byCategory[c])
  const featuredGames = games.filter(g => g.banner_url)
  const heroGame = featuredGames[heroIndex] ?? null
  const selectedGame = games.find(g => g.slug === activeGame) ?? null

  const isFiltered = !!(activeGame || activeCategory)

  const visibleGames = activeGame
    ? games.filter(g => g.slug === activeGame)
    : activeCategory
    ? (byCategory[activeCategory] ?? [])
    : games

  const allGameSections = visibleGames
    .map(g => ({ game: g, items: listings.filter(l => l.games?.slug === g.slug).slice(0, 4) }))
    .filter(s => s.items.length > 0)
    .sort((a, b) => b.game.listing_count - a.game.listing_count)

  const HOME_LIMIT = 3
  const gameSections = isFiltered ? allGameSections : allGameSections.slice(0, HOME_LIMIT)
  const hasMore = !isFiltered && allGameSections.length > HOME_LIMIT

  return (
    <div>

      {/* ── Sticky filter bar: categories + games ── */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1.5 overflow-x-auto py-2.5 scrollbar-none">

            {/* All */}
            <button
              onClick={() => { setActiveGame(null); setActiveCategory(null) }}
              className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                !activeGame && !activeCategory
                  ? 'bg-accent text-black'
                  : 'bg-surface border border-border text-gray-400 hover:text-white'
              }`}
            >
              <Gamepad2 size={12} /> All
            </button>

            {/* Category chips */}
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat === activeCategory ? null : cat); setActiveGame(null) }}
                className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  activeCategory === cat && !activeGame
                    ? 'bg-accent text-black'
                    : 'bg-surface border border-border text-gray-400 hover:text-white'
                }`}
              >
                {CATEGORY_ICON[cat]}
                {cat}
              </button>
            ))}

            {/* Divider */}
            <span className="h-5 w-px bg-border self-center mx-1 shrink-0" />

            {/* Individual game chips */}
            {games.map(g => (
              <button
                key={g.id}
                onClick={() => { setActiveGame(g.slug === activeGame ? null : g.slug); setActiveCategory(null) }}
                className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  activeGame === g.slug
                    ? 'bg-accent text-black'
                    : 'bg-surface border border-border text-gray-400 hover:text-white'
                }`}
              >
                <GameLogo src={g.logo_url} slug={g.slug} name={g.name} className="w-3.5 h-3.5 rounded-full" />
                {g.name}
                {g.listing_count > 0 && (
                  <span className={activeGame === g.slug ? 'opacity-50' : 'text-gray-700'}>{g.listing_count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">

        {/* ── Hero carousel ── */}
        {!activeGame && !activeCategory && featuredGames.length > 0 && heroGame && (
          <div className="pt-5 pb-5">
            <div className="relative rounded-2xl overflow-hidden group" style={{ height: 'clamp(180px, 30vw, 400px)' }}>
              <div className="absolute inset-0">
                <GameBanner src={heroGame.banner_url} slug={heroGame.slug} name={heroGame.name} className="w-full h-full transition-all duration-500" />
              </div>
              <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-0 flex items-end p-6 md:p-10">
                <div className="flex items-end gap-4">
                  <GameLogo src={heroGame.logo_url} slug={heroGame.slug} name={heroGame.name} className="hidden sm:flex w-16 h-16 md:w-20 md:h-20 rounded-2xl shadow-2xl shrink-0 items-center justify-center" />
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded bg-accent/20 border border-accent/40 text-accent text-[10px] font-bold uppercase tracking-widest mb-2">
                      {heroGame.category ?? 'Featured'}
                    </span>
                    <h2 className="text-white text-2xl md:text-4xl font-black leading-tight drop-shadow">{heroGame.name}</h2>
                    <p className="text-gray-300 text-sm mt-1">{heroGame.listing_count} items available</p>
                    <button
                      onClick={() => setActiveGame(heroGame.slug)}
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-accent text-black text-xs font-bold hover:opacity-90 transition-opacity"
                    >
                      Browse Items <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {featuredGames.length > 1 && (
                <>
                  <button onClick={() => setHeroIndex(i => (i - 1 + featuredGames.length) % featuredGames.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                    <ChevronLeft size={16} />
                  </button>
                  <button onClick={() => setHeroIndex(i => (i + 1) % featuredGames.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80">
                    <ChevronRight size={16} />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {featuredGames.map((_, i) => (
                      <button key={i} onClick={() => setHeroIndex(i)}
                        className={`h-1 rounded-full transition-all ${i === heroIndex ? 'w-6 bg-accent' : 'w-1.5 bg-white/30 hover:bg-white/60'}`} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Category banner grid ── */}
        {!activeGame && !activeCategory && featuredGames.length > 1 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-8">
            {featuredGames.filter((_, i) => i !== heroIndex).slice(0, 4).map(g => (
              <button key={g.id} onClick={() => setActiveGame(g.slug)}
                className="group relative rounded-xl overflow-hidden text-left"
                style={{ height: 'clamp(70px, 10vw, 130px)' }}
              >
                <div className="absolute inset-0 group-hover:scale-105 transition-transform duration-300">
                  <GameBanner src={g.banner_url} slug={g.slug} name={g.name} className="w-full h-full" />
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 flex items-center gap-1.5">
                  <GameLogo src={g.logo_url} slug={g.slug} name={g.name} className="w-5 h-5 rounded-md shrink-0" />
                  <div className="min-w-0">
                    <p className="text-white font-bold text-[11px] truncate">{g.name}</p>
                    <p className="text-gray-400 text-[10px]">{g.listing_count} items</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Category header (when category filter active) ── */}
        {activeCategory && !activeGame && (
          <div className="pt-5 pb-4 flex items-center gap-3">
            <div className="flex items-center gap-2 text-accent">
              {CATEGORY_ICON[activeCategory]}
              <h2 className="text-white font-black text-xl">{activeCategory}</h2>
            </div>
            <span className="text-gray-600 text-sm">{(byCategory[activeCategory] ?? []).length} games</span>
          </div>
        )}

        {/* ── Selected game banner ── */}
        {selectedGame && (
          <div className="pt-5 pb-5">
            <div className="relative rounded-2xl overflow-hidden" style={{ height: 'clamp(100px, 18vw, 200px)' }}>
              <GameBanner src={selectedGame.banner_url} slug={selectedGame.slug} name={selectedGame.name} className="w-full h-full" />
              <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent" />
              <div className="absolute inset-0 flex items-center px-5 gap-4">
                <GameLogo src={selectedGame.logo_url} slug={selectedGame.slug} name={selectedGame.name} className="w-12 h-12 md:w-16 md:h-16 rounded-2xl shadow-lg shrink-0" />
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">{selectedGame.category}</p>
                  <p className="text-white text-xl md:text-3xl font-black">{selectedGame.name}</p>
                  <p className="text-gray-300 text-sm">{selectedGame.listing_count} listings available</p>
                </div>
                <button onClick={() => setActiveGame(null)}
                  className="ml-auto px-3 py-1.5 rounded-full border border-white/20 text-white text-xs hover:border-white/50 transition-colors">
                  ← Back
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        {gameSections.length > 0 && (
          <div className="flex items-center gap-3 py-2 mb-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-gray-600 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">Listings</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        {/* ── Game sections ── */}
        {gameSections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Gamepad2 size={40} className="text-gray-700" />
            <p className="text-gray-500">No listings yet.</p>
            <Link href="/listings/new" className="text-accent text-sm hover:underline">Be the first to sell →</Link>
          </div>
        ) : (
          <div className="space-y-10">
            {gameSections.map(({ game, items }) => {
              return (
              <section key={game.id}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-3 px-1">
                  <GameLogo src={game.logo_url} slug={game.slug} name={game.name} className="w-7 h-7 rounded-lg shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-sm truncate">{game.name}</p>
                    <p className="text-gray-600 text-[10px]">{game.category}</p>
                  </div>
                  <Link href={`/market?game=${game.slug}`}
                    className="flex items-center gap-0.5 text-accent text-xs font-medium hover:underline shrink-0">
                    See all <ChevronRight size={12} />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((l) => <ListingCard key={l.id} listing={l} isHot={hotIds.has(l.id)} />)}
                </div>
              </section>
              )
            })}
          </div>
        )}

        {/* ── See more → Market ── */}
        {hasMore && (
          <div className="flex items-center gap-3 px-1 mt-6">
            <div className="flex-1 h-px bg-border" />
            <Link
              href="/market"
              className="flex items-center gap-0.5 text-accent text-xs font-medium hover:underline shrink-0"
            >
              See all in Market <ChevronRight size={12} />
            </Link>
          </div>
        )}

        {/* ── How it works ── */}
        <div className="mt-12 mb-12">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-black text-white">How it works</h2>
            <p className="text-gray-500 text-sm mt-1">Trade in-game items in 3 simple steps</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: '01',
                title: 'List your item',
                desc: 'Post what you want to sell',
                icon: 'M12 4v16m8-8H4',
              },
              {
                step: '02',
                title: 'Buyer pays escrow',
                desc: 'Payment is held securely in escrow until the trade is confirmed by both sides.',
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
              },
              {
                step: '03',
                title: 'Confirm & receive',
                desc: 'Deliver the item, buyer confirms, and funds are released to your wallet.',
                icon: 'M5 13l4 4L19 7',
              },
            ].map(({ step, title, desc, icon }) => (
              <div key={step} className="relative flex flex-col gap-3 p-5 rounded-2xl border border-border bg-surface">
                <span className="text-4xl font-black text-white/5 absolute top-4 right-5 select-none">{step}</span>
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trust & Safety ── */}
        <div className="rounded-2xl border border-border bg-surface p-6 md:p-8 mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-black text-white">Trust & Safety</h2>
            <p className="text-gray-500 text-sm mt-1">Every trade is protected from start to finish</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Escrow Protection',
                desc: 'Funds are held until both parties confirm the trade is complete.',
                icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
                color: 'text-accent',
                bg: 'bg-accent/10 border-accent/20',
              },
              {
                title: 'KYC Verified Sellers',
                desc: 'Every seller is identity-verified before they can list items.',
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                color: 'text-green-400',
                bg: 'bg-green-500/10 border-green-500/20',
              },
              {
                title: 'Dispute Resolution',
                desc: 'Our team mediates any trade disputes to ensure a fair outcome.',
                icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10 border-yellow-500/20',
              },
              {
                title: 'Crypto Payments',
                desc: 'Pay with USDT, ETH, or BTC — fast, borderless, and secure.',
                icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                color: 'text-purple-400',
                bg: 'bg-purple-500/10 border-purple-500/20',
              },
            ].map(({ title, desc, icon, color, bg }) => (
              <div key={title} className="flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${bg}`}>
                  <svg className={`w-5 h-5 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{title}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
