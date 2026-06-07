import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { GameLogo } from '@/components/games/GameImage'
import Link from 'next/link'
import type { ListingWithGame } from '@/lib/types'

interface SearchParams { game?: string; category?: string; q?: string; currency?: string; page?: string }

const PAGE_SIZE = 20 // 4 cols × 5 rows

function buildHref(params: Record<string, string | undefined>, overrides: Record<string, string | undefined>) {
  const merged = { ...params, ...overrides }
  const qs = Object.entries(merged)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join('&')
  return `/market${qs ? `?${qs}` : ''}`
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page   = Math.max(1, parseInt(params.page ?? '1', 10))
  const from   = (page - 1) * PAGE_SIZE
  const to     = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const [{ data: games }, listingsRes] = await Promise.all([
    supabase.from('games').select('id, name, slug, category, logo_url').order('name'),
    (() => {
      let q = supabase
        .from('listings')
        .select('id, title, price_amount, price_currency, images, status, seller_id, games(name, slug, category, logo_url, banner_url), profiles:seller_id(username)', { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(from, to)
      if (params.q)        q = q.ilike('title', `%${params.q}%`)
      if (params.currency) q = q.eq('price_currency', params.currency)
      if (params.game)     q = q.eq('games.slug', params.game)
      if (params.category) q = q.eq('games.category', params.category)
      return q
    })(),
  ])

  const listings   = (listingsRes.data ?? []) as unknown as ListingWithGame[]
  const totalCount = listingsRes.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const activeGame     = params.game ?? null
  const activeCategory = params.category ?? null
  const categories     = Array.from(new Set((games ?? []).map(g => g.category).filter(Boolean)))

  const filterParams = {
    game:     params.game,
    category: params.category,
    q:        params.q,
    currency: params.currency,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black text-white">Market</h1>
        <p className="text-gray-500 text-sm mt-1">{totalCount} listings available</p>
      </div>

      <div className="flex gap-6">

        {/* Sidebar filters */}
        <aside className="hidden md:flex flex-col gap-6 w-48 shrink-0">
          <div>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest mb-2">Filter</p>
            <Link
              href="/market"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                !activeGame && !activeCategory ? 'bg-accent/10 text-accent font-semibold' : 'text-gray-400 hover:text-white'
              }`}
            >
              All listings
            </Link>
          </div>

          <div>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest mb-2">Category</p>
            <div className="space-y-0.5">
              {categories.map(cat => (
                <Link
                  key={cat}
                  href={buildHref(filterParams, { category: cat!, page: undefined })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCategory === cat ? 'bg-accent/10 text-accent font-semibold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest mb-2">Game</p>
            <div className="space-y-0.5 max-h-80 overflow-y-auto scrollbar-none">
              {(games ?? []).map(g => (
                <Link
                  key={g.id}
                  href={buildHref(filterParams, { game: g.slug, page: undefined })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeGame === g.slug ? 'bg-accent/10 text-accent font-semibold' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <GameLogo src={g.logo_url} slug={g.slug} name={g.name} className="w-5 h-5 rounded-md shrink-0" />
                  <span className="truncate">{g.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Mobile filter chips */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-3 scrollbar-none mb-4">
            <Link href="/market"
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                !activeGame && !activeCategory ? 'bg-accent text-black border-accent' : 'border-border text-gray-400'
              }`}>All</Link>
            {categories.map(cat => (
              <Link key={cat} href={buildHref(filterParams, { category: cat!, page: undefined })}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                  activeCategory === cat ? 'bg-accent text-black border-accent' : 'border-border text-gray-400'
                }`}>{cat}</Link>
            ))}
            {(games ?? []).map(g => (
              <Link key={g.id} href={buildHref(filterParams, { game: g.slug, page: undefined })}
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
                {listings.map((l, i) => <ListingCard key={l.id} listing={l} rank={from + i} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-8">
                  {/* Prev */}
                  {page > 1 ? (
                    <Link
                      href={buildHref(filterParams, { page: String(page - 1) })}
                      className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
                    >
                      ←
                    </Link>
                  ) : (
                    <span className="px-3 py-2 rounded-lg text-sm text-gray-700 cursor-not-allowed">←</span>
                  )}

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                    .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-gray-600 text-sm">…</span>
                      ) : (
                        <Link
                          key={p}
                          href={buildHref(filterParams, { page: p === 1 ? undefined : String(p) })}
                          className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            p === page
                              ? 'bg-accent text-black'
                              : 'text-gray-400 hover:text-white hover:bg-white/8'
                          }`}
                        >
                          {p}
                        </Link>
                      )
                    )
                  }

                  {/* Next */}
                  {page < totalPages ? (
                    <Link
                      href={buildHref(filterParams, { page: String(page + 1) })}
                      className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-colors"
                    >
                      →
                    </Link>
                  ) : (
                    <span className="px-3 py-2 rounded-lg text-sm text-gray-700 cursor-not-allowed">→</span>
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
