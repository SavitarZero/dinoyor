import { createClient } from '@/lib/supabase/server'
import { getCachedGames } from '@/lib/cache/games'
import { ListingCard } from '@/components/listings/ListingCard'
import { GameLogo } from '@/components/games/GameImage'
import { GameFilter } from '@/components/market/GameFilter'
import Link from 'next/link'
import type { ListingWithGame } from '@/lib/types'

interface SearchParams { game?: string; category?: string; cat?: string; q?: string; currency?: string; page?: string }

const PAGE_SIZE = 20
const NULL_UUID  = '00000000-0000-0000-0000-000000000000'

type PageItem = { type: 'page'; num: number } | { type: 'ellipsis'; key: string }

function buildHref(params: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const merged = { ...params, ...overrides }
  const qs = Object.entries(merged)
    .filter((entry): entry is [string, string] => entry[1] !== undefined && entry[1] !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  return qs ? `/market?${qs}` : '/market'
}

function getFilterGameIds(games: { id: string; slug: string; category_id?: string | null }[], params: SearchParams) {
  if (params.game) {
    const match = games.find(g => g.slug === params.game)
    return match ? [match.id] : [NULL_UUID]
  }
  if (params.category) {
    const ids = games.filter(g => g.category_id === params.category).map(g => g.id)
    return ids.length > 0 ? ids : [NULL_UUID]
  }
  return null
}

function buildActiveFilters(activeGame: string | null, activeCategory: string | null) {
  const filters: Record<string, string | undefined> = {}
  if (activeGame) filters.game = activeGame
  else if (activeCategory) filters.category = activeCategory
  return filters
}

function buildPageItems(totalPages: number, page: number): PageItem[] {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
    .reduce<PageItem[]>((acc, p, idx, arr) => {
      const prev = arr[idx - 1]
      if (idx > 0 && prev !== undefined && p - prev > 1) {
        acc.push({ type: 'ellipsis', key: `dots-${prev}-${p}` })
      }
      acc.push({ type: 'page', num: p })
      return acc
    }, [])
}

export default async function MarketPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<SearchParams>
}>) {
  const params = await searchParams
  const page   = Math.max(1, Number.parseInt(params.page ?? '1', 10))
  const from   = (page - 1) * PAGE_SIZE
  const to     = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const [games, { data: dbCategories }] = await Promise.all([
    getCachedGames(),
    supabase.from('categories').select('id, name').eq('active', true).order('sort_order'),
  ])

  const filterGameIds = getFilterGameIds(games, params)

  let query = supabase
    .from('listings')
    .select('id, title, price_amount, price_currency, images, status, seller_id, sold_count, game_id, games(name, slug, logo_url, banner_url), profiles:seller_id(username, avatar_url)', { count: 'exact' })
    .eq('status', 'active')
    .order('sold_count', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to)

  const itemCategories = dbCategories ?? []
  const activeCat      = params.cat ?? null

  if (params.q)        query = query.ilike('title', `%${params.q}%`)
  if (params.currency) query = query.eq('price_currency', params.currency)
  if (filterGameIds)   query = query.in('game_id', filterGameIds)
  if (activeCat) {
    const gameIdsInCat = games.filter(g => g.category_id === activeCat).map(g => g.id)
    if (gameIdsInCat.length > 0) {
      query = query.in('game_id', gameIdsInCat)
    } else {
      query = query.eq('game_id', NULL_UUID)
    }
  }

  const listingsRes = await query

  const listings   = (listingsRes.data ?? []) as unknown as ListingWithGame[]
  const totalCount = listingsRes.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const activeGame     = params.game ?? null
  const activeCategory = params.category ?? null
  const gameCategories = (dbCategories ?? []).filter(cat => games.some(g => g.category_id === cat.id))

  const filterParams  = { q: params.q, currency: params.currency, cat: params.cat }
  const activeFilters = buildActiveFilters(activeGame, activeCategory)
  const pageItems     = buildPageItems(totalPages, page)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">Market</h1>
        <p className="text-gray-500 text-sm mt-1">{totalCount} listings available</p>
      </div>

      <div className="flex gap-6">

        {/* Sidebar filters */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-4">

            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Filter</p>
              </div>
              <div className="p-2">
                <Link
                  href={buildHref(filterParams, {})}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    !activeGame && !activeCategory && !activeCat ? 'bg-accent/10 text-accent font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  All listings
                </Link>
              </div>
            </div>

            {itemCategories.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Category</p>
                </div>
                <div className="p-2 space-y-0.5">
                  {itemCategories.map(cat => (
                    <Link
                      key={cat.id}
                      href={buildHref(filterParams, { cat: cat.id })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCat === cat.id ? 'bg-accent/10 text-accent font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {gameCategories.length > 0 && (
              <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Genre</p>
                </div>
                <div className="p-2 space-y-0.5">
                  {gameCategories.map(cat => (
                    <Link
                      key={cat.id}
                      href={buildHref(filterParams, { category: cat.id })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === cat.id && !activeGame ? 'bg-accent/10 text-accent font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Game</p>
              </div>
              <div className="p-2">
                <GameFilter
                  games={games}
                  activeGame={activeGame}
                  filterParams={filterParams}
                />
              </div>
            </div>

          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Mobile filter chips */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-3 scrollbar-none mb-4">
            <Link href={buildHref(filterParams, {})}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                !activeGame && !activeCategory ? 'bg-accent text-black border-accent' : 'border-border text-gray-400'
              }`}>All</Link>
            {itemCategories.map(cat => (
              <Link key={cat.id} href={buildHref(filterParams, { cat: cat.id })}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                  activeCat === cat.id ? 'bg-accent text-black border-accent' : 'border-border text-gray-400'
                }`}>{cat.name}</Link>
            ))}
            {gameCategories.map(cat => (
              <Link key={cat.id} href={buildHref(filterParams, { category: cat.id })}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                  activeCategory === cat.id && !activeGame ? 'bg-accent text-black border-accent' : 'border-border text-gray-400'
                }`}>{cat.name}</Link>
            ))}
            {games.map(g => (
              <Link key={g.id} href={buildHref(filterParams, { game: g.slug })}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  activeGame === g.slug ? 'bg-accent text-black border-accent' : 'border-border text-gray-400'
                }`}>
                <GameLogo src={g.logo_url} slug={g.slug} name={g.name} className="w-3.5 h-3.5 rounded-full" />
                {g.name}
              </Link>
            ))}
          </div>

          {listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <p className="text-gray-500">No listings found.</p>
              <Link href="/market" className="text-accent text-sm hover:underline">Clear filters</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-8">
                  {page > 1 ? (
                    <Link
                      href={buildHref({ ...filterParams, ...activeFilters }, { page: String(page - 1) })}
                      className="px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
                    >←</Link>
                  ) : (
                    <span className="px-3 py-2 rounded text-sm text-gray-700 cursor-not-allowed">←</span>
                  )}

                  {pageItems.map(item =>
                    item.type === 'ellipsis' ? (
                      <span key={item.key} className="px-2 text-gray-600 text-sm">…</span>
                    ) : (
                      <Link
                        key={item.num}
                        href={buildHref({ ...filterParams, ...activeFilters }, { page: item.num === 1 ? undefined : String(item.num) })}
                        className={`w-9 h-9 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                          item.num === page ? 'bg-accent text-black' : 'text-gray-400 hover:text-white hover:bg-white/8'
                        }`}
                      >{item.num}</Link>
                    )
                  )}

                  {page < totalPages ? (
                    <Link
                      href={buildHref({ ...filterParams, ...activeFilters }, { page: String(page + 1) })}
                      className="px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
                    >→</Link>
                  ) : (
                    <span className="px-3 py-2 rounded text-sm text-gray-700 cursor-not-allowed">→</span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
