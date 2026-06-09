import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { RemoveListingButton } from '@/components/listings/RemoveListingButton'
import { RelistButton } from '@/components/listings/RelistButton'
import { EditPriceButton } from '@/components/listings/EditPriceButton'

const STATUS_LABEL: Record<string, string> = {
  active:    'Active',
  sold:      'Sold',
  cancelled: 'Cancelled',
}

const STATUS_CLASS: Record<string, string> = {
  active:    'bg-green-400/10 text-green-400 border-green-400/20',
  sold:      'bg-accent/10 text-accent border-accent/20',
  cancelled: 'bg-border/50 text-gray-500 border-border',
}

type FilterStatus = 'active' | 'sold' | 'cancelled'
const PAGE_SIZE = 12

export default async function MyListingsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ status?: string; page?: string }>
}>) {
  const { status: statusParam, page: pageParam } = await searchParams
  const filter: FilterStatus =
    ['active', 'sold', 'cancelled'].includes(statusParam ?? '')
      ? (statusParam as FilterStatus)
      : 'active'

  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const [
    { data: filtered, count: filteredCount },
    { count: totalActive },
    { count: totalSold },
    { count: totalCancelled },
    { data: allListings },
  ] = await Promise.all([
    supabase
      .from('listings')
      .select('id, title, price_amount, price_currency, images, status, sold_count, created_at, games(name, logo_url)', { count: 'exact' })
      .eq('seller_id', user.id)
      .eq('status', filter)
      .order('created_at', { ascending: false })
      .range(from, to),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'active'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'sold'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'cancelled'),
    supabase.from('listings').select('sold_count').eq('seller_id', user.id),
  ])

  const listings = filtered ?? []
  const totalCount = filteredCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const totalSoldItems = (allListings ?? []).reduce((s, l) => s + (l.sold_count ?? 0), 0)

  // Order map for sold listings
  const soldListingIds = listings.filter(l => l.status === 'sold').map(l => l.id)
  let orderMap: Record<string, string> = {}
  if (soldListingIds.length > 0) {
    const { data: orders } = await supabase
      .from('orders')
      .select('id, listing_id')
      .in('listing_id', soldListingIds)
      .in('status', ['paid_escrow', 'delivered', 'completed'])
      .order('created_at', { ascending: false })
    for (const o of orders ?? []) {
      if (!orderMap[o.listing_id]) orderMap[o.listing_id] = o.id
    }
  }

  const tabs: { label: string; value: FilterStatus; count: number | null }[] = [
    { label: 'On Sale',    value: 'active',    count: totalActive ?? 0 },
    { label: 'Sold',       value: 'sold',      count: totalSold ?? 0 },
    { label: 'Cancelled',  value: 'cancelled', count: totalCancelled ?? 0 },
  ]

  function pageHref(p: number) {
    const params = new URLSearchParams()
    if (filter !== 'active') params.set('status', filter)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/listings${qs ? `?${qs}` : ''}`
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

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-white">My Listings</h1>
          <p className="text-gray-500 text-xs mt-0.5">Manage the items you're selling</p>
        </div>
        <Link
          href="/listings/new"
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-bold hover:opacity-90 transition-opacity shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="rounded-2xl border border-border bg-surface">
        <div className="grid grid-cols-4 divide-x divide-border">
          {[
            { label: 'On Sale',    value: totalActive ?? 0,    color: 'text-green-400' },
            { label: 'Sold',       value: totalSoldItems,       color: 'text-accent' },
            { label: 'Cancelled',  value: totalCancelled ?? 0,  color: 'text-gray-400' },
            { label: 'Total Sold', value: totalSold ?? 0,       color: 'text-white' },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-4 py-3 text-center">
              <p className={`font-bold text-sm ${color}`}>{value}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded p-1 w-fit">
        {tabs.map(tab => (
          <Link
            key={tab.value}
            href={tab.value === 'active' ? '/listings' : `/listings?status=${tab.value}`}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-sm font-medium transition-colors ${
              filter === tab.value
                ? 'bg-accent text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                filter === tab.value ? 'bg-black/20 text-black' : 'bg-white/5 text-gray-500'
              }`}>
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Listing grid */}
      {listings.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {listings.map((listing: any) => {
              let cardClass = 'border-border hover:border-gray-500/40'
              if (listing.status === 'sold') cardClass = 'border-border opacity-75'
              return (
              <div
                key={listing.id}
                className={`flex flex-col rounded border bg-surface overflow-hidden transition-colors ${cardClass}`}
              >
                {/* Image */}
                <div className="relative aspect-square bg-background overflow-hidden">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {/* Status + sold count */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${STATUS_CLASS[listing.status] ?? 'bg-gray-700/50 text-gray-400 border-border'}`}>
                      {STATUS_LABEL[listing.status] ?? listing.status}
                    </span>
                    {listing.sold_count > 0 && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded border border-border bg-black/50 text-gray-400">
                        {listing.sold_count}× sold
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-1.5 flex-1">
                  <p className="text-white text-xs font-medium leading-snug line-clamp-2">
                    {listing.title}
                  </p>
                  {listing.games && (
                    <div className="flex items-center gap-1">
                      {listing.games.logo_url && (
                        <Image src={listing.games.logo_url} alt="" width={14} height={14} className="rounded-sm object-cover shrink-0" />
                      )}
                      <p className="text-gray-600 text-xs truncate">{listing.games.name}</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-auto pt-1.5">
                    <span className="text-accent font-bold text-sm tabular-nums">
                      {listing.price_amount} AMO
                    </span>
                    <span className="text-gray-600 text-[10px]">
                      {new Date(listing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="border-t border-border px-3 py-2.5 flex gap-2">
                  <Link
                    href={listing.status === 'sold' && orderMap[listing.id] ? `/orders/${orderMap[listing.id]}` : `/market/${listing.id}`}
                    className="flex-1 py-1.5 rounded border border-border text-gray-400 text-xs font-medium text-center hover:text-white hover:border-gray-500 transition-colors"
                  >
                    {listing.status === 'sold' && orderMap[listing.id] ? 'View Order' : 'View'}
                  </Link>
                  {listing.status === 'active' && (
                    <RemoveListingButton listingId={listing.id} />
                  )}
                  <EditPriceButton listingId={listing.id} currentPrice={listing.price_amount} status={listing.status} />
                  {(listing.status === 'cancelled' || listing.status === 'sold') && (
                    <RelistButton listingId={listing.id} />
                  )}
                </div>
              </div>
            )})}
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
      ) : (
        <div className="p-16 text-center space-y-3">
          <svg className="w-12 h-12 text-gray-700 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-500 text-sm">
            {`No ${filter === 'active' ? 'active' : filter} listings.`}
          </p>
          {filter === 'active' && (
            <Link href="/listings/new" className="inline-block text-accent text-sm hover:underline">
              Create your first listing →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
