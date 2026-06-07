import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ListingCard } from '@/components/listings/ListingCard'
import type { ListingWithGame } from '@/lib/types/index'

const PAGE_SIZE = 20

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

  const [listingsRes, { data: soldAgg }] = await Promise.all([
    supabase
      .from('listings')
      .select('id, title, price_amount, price_currency, images, status, seller_id, sold_count, games(name, slug, category, logo_url, banner_url), profiles:seller_id(username)', { count: 'exact' })
      .eq('seller_id', seller.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .range(from, to),

    supabase
      .from('listings')
      .select('sold_count')
      .eq('seller_id', seller.id),
  ])

  const listings = (listingsRes.data ?? []) as unknown as ListingWithGame[]
  const totalCount = listingsRes.count ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const totalSold = (soldAgg ?? []).reduce((sum, l) => sum + (l.sold_count ?? 0), 0)

  const joinedYear = seller.created_at
    ? new Date(seller.created_at).getFullYear()
    : null

  function pageHref(p: number) {
    return `/seller/${username}${p > 1 ? `?page=${p}` : ''}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* Store header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl border border-border bg-surface">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full bg-background overflow-hidden shrink-0 ring-2 ring-border">
          {seller.avatar_url ? (
            <img src={seller.avatar_url} alt={seller.username} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
              {(seller.username || '?')[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">@{seller.username}</h1>
            {seller.kyc_status === 'approved' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-xs font-medium">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Verified
              </span>
            )}
          </div>
          {joinedYear && (
            <p className="text-gray-500 text-sm mt-0.5">Member since {joinedYear}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-6 shrink-0">
          <div className="text-center">
            <p className="text-white font-bold text-lg">{totalCount}</p>
            <p className="text-gray-500 text-xs">Listings</p>
          </div>
          <div className="w-px bg-border" />
          <div className="text-center">
            <p className="text-white font-bold text-lg">{totalSold}</p>
            <p className="text-gray-500 text-xs">Sold</p>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div>
        <h2 className="text-white font-semibold mb-4">
          Active Listings
          {totalCount > 0 && <span className="text-gray-500 font-normal text-sm ml-2">({totalCount})</span>}
        </h2>

        {listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-2 text-center">
            <p className="text-gray-500">No active listings from this seller.</p>
            <Link href="/market" className="text-accent text-sm hover:underline">Browse market</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {listings.map((l, i) => (
                <ListingCard key={l.id} listing={l} rank={from + i} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                {page > 1 ? (
                  <Link href={pageHref(page - 1)} className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-colors">←</Link>
                ) : (
                  <span className="px-3 py-2 rounded-lg text-sm text-gray-700 cursor-not-allowed">←</span>
                )}

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`e-${i}`} className="px-2 text-gray-600 text-sm">…</span>
                    ) : (
                      <Link
                        key={p}
                        href={pageHref(p as number)}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          p === page ? 'bg-accent text-black' : 'text-gray-400 hover:text-white hover:bg-white/8'
                        }`}
                      >
                        {p}
                      </Link>
                    )
                  )
                }

                {page < totalPages ? (
                  <Link href={pageHref(page + 1)} className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-colors">→</Link>
                ) : (
                  <span className="px-3 py-2 rounded-lg text-sm text-gray-700 cursor-not-allowed">→</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
