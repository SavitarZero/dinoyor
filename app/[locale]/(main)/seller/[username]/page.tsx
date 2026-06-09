import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ListingCard } from '@/components/listings/ListingCard'
import type { ListingWithGame } from '@/lib/types/index'

const PAGE_SIZE = 12

export default async function SellerStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { username } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const { data: seller } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, kyc_status, created_at')
    .eq('username', username)
    .single()

  if (!seller) notFound()

  const listingsRes = await supabase
    .from('listings')
    .select('id, title, price_amount, price_currency, images, status, seller_id, sold_count, game_id', { count: 'exact' })
    .eq('seller_id', seller.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .range(from, to)

  // Fetch games separately to avoid RLS issues with joins
  const gameIds = [...new Set((listingsRes.data ?? []).map(l => l.game_id).filter(Boolean))]
  let gamesMap: Record<string, any> = {}
  if (gameIds.length > 0) {
    const { data: games } = await supabase.from('games').select('id, name, slug, category, logo_url, banner_url').in('id', gameIds)
    for (const g of games ?? []) gamesMap[g.id] = g
  }

  const listings = (listingsRes.data ?? []).map(l => ({ ...l, games: gamesMap[l.game_id] ?? null })) as unknown as ListingWithGame[]
  const totalCount = listingsRes.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  const { data: soldAgg } = await supabase
    .from('listings')
    .select('sold_count')
    .eq('seller_id', seller.id)

  const totalSold = (soldAgg ?? []).reduce((sum, l) => sum + (l.sold_count ?? 0), 0)

  const joinedDate = seller.created_at
    ? new Date(seller.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  function pageHref(p: number) {
    return `/seller/${username}${p > 1 ? `?page=${p}` : ''}`
  }

  type PageItem = { type: 'page'; num: number } | { type: 'ellipsis'; key: string }
  const pageItems: PageItem[] = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
    .reduce<PageItem[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - arr[idx - 1] > 1) acc.push({ type: 'ellipsis', key: `dots-${p}` })
      acc.push({ type: 'page', num: p })
      return acc
    }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* Store header */}
      <div className="rounded-2xl border border-border bg-surface">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-4 py-4">
          {/* Avatar */}
          <div className="relative w-12 h-12 rounded-lg bg-background overflow-hidden shrink-0 border border-border">
            {seller.avatar_url ? (
              <Image src={seller.avatar_url} alt={seller.username ?? ''} fill unoptimized className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500">
                {(seller.username || '?')[0].toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-white">@{seller.username}</h1>
              {seller.kyc_status === 'approved' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Verified
                </span>
              )}
            </div>
            {joinedDate && (
              <p className="text-gray-500 text-xs mt-0.5">Member since {joinedDate}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
          <div className="px-4 py-3 text-center">
            <p className="text-white font-bold text-sm">{totalCount}</p>
            <p className="text-gray-500 text-xs">On Sale</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-accent font-bold text-sm">{totalSold}</p>
            <p className="text-gray-500 text-xs">Sold</p>
          </div>
          <div className="px-4 py-3 text-center">
            <p className="text-white font-bold text-sm">{joinedDate ?? '—'}</p>
            <p className="text-gray-500 text-xs">Joined</p>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">
            Items for Sale
            {totalCount > 0 && <span className="text-gray-500 font-normal text-xs ml-2">({totalCount})</span>}
          </h2>
        </div>

        {listings.length === 0 ? (
          <div className="p-16 text-center space-y-2">
            <p className="text-gray-500 text-sm">No active listings from this seller.</p>
            <Link href="/market" className="text-accent text-sm hover:underline">Browse market →</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} hideProfile />
              ))}
            </div>

            {/* Pagination */}
            {totalCount >= 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} className="px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-colors">←</Link>
                ) : (
                  <span className="px-3 py-2 rounded text-sm text-gray-700 cursor-not-allowed">←</span>
                )}

                {pageItems.map(item =>
                  item.type === 'ellipsis' ? (
                    <span key={item.key} className="px-2 text-gray-600 text-sm">…</span>
                  ) : (
                    <Link
                      key={item.num}
                      href={pageHref(item.num)}
                      className={`w-9 h-9 flex items-center justify-center rounded text-sm font-medium transition-colors ${
                        item.num === page ? 'bg-accent text-black' : 'text-gray-400 hover:text-white hover:bg-white/8'
                      }`}
                    >{item.num}</Link>
                  )
                )}

                {page < totalPages ? (
                  <Link href={pageHref(page + 1)} className="px-3 py-2 rounded text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-colors">→</Link>
                ) : (
                  <span className="px-3 py-2 rounded text-sm text-gray-700 cursor-not-allowed">→</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
