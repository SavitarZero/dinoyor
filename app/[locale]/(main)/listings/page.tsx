import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cancelListing } from '@/lib/actions/listings'

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

type FilterStatus = 'all' | 'active' | 'sold' | 'cancelled'

export default async function MyListingsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ status?: string }>
}>) {
  const { status: statusParam } = await searchParams
  const filter: FilterStatus =
    ['active', 'sold', 'cancelled'].includes(statusParam ?? '')
      ? (statusParam as FilterStatus)
      : 'all'

  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const [
    { data: listings },
    { count: totalActive },
    { count: totalSold },
    { count: totalCancelled },
  ] = await Promise.all([
    supabase
      .from('listings')
      .select('id, title, price_amount, price_currency, images, status, sold_count, created_at, games(name, logo_url)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'active'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'sold'),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'cancelled'),
  ])

  const filtered = filter === 'all' ? (listings ?? []) : (listings ?? []).filter(l => l.status === filter)

  const totalSoldItems = (listings ?? []).reduce((s, l) => s + (l.sold_count ?? 0), 0)

  const tabs: { label: string; value: FilterStatus; count: number | null }[] = [
    { label: 'All',       value: 'all',       count: null },
    { label: 'Active',    value: 'active',    count: totalActive ?? 0 },
    { label: 'Sold',      value: 'sold',      count: totalSold ?? 0 },
    { label: 'Cancelled', value: 'cancelled', count: totalCancelled ?? 0 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Listings</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage the items you're selling</p>
        </div>
        <Link
          href="/listings/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded bg-accent text-black text-sm font-bold hover:opacity-90 transition-opacity shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Listing
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Active',         value: totalActive ?? 0,    color: 'text-green-400' },
          { label: 'Sold',           value: totalSold ?? 0,      color: 'text-accent' },
          { label: 'Units sold',     value: totalSoldItems,       color: 'text-white' },
          { label: 'Total listings', value: (listings ?? []).length, color: 'text-white' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded border border-border bg-surface p-4">
            <p className="text-gray-500 text-xs">{label}</p>
            <p className={`text-2xl font-bold mt-0.5 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-border rounded p-1 w-fit">
        {tabs.map(tab => (
          <Link
            key={tab.value}
            href={tab.value === 'all' ? '/listings' : `/listings?status=${tab.value}`}
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
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((listing: any) => {
            let cardClass = 'border-border hover:border-accent/40'
            if (listing.status === 'cancelled') cardClass = 'border-border opacity-50'
            else if (listing.status === 'sold') cardClass = 'border-border opacity-75'
            return (
            <div
              key={listing.id}
              className={`flex flex-col rounded border bg-surface overflow-hidden transition-colors ${cardClass}`}
            >
              {/* Image */}
              <div className="relative aspect-video bg-background overflow-hidden">
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
                  <div className="flex items-center gap-1.5">
                    {listing.games.logo_url && (
                      <img src={listing.games.logo_url} alt="" className="w-3.5 h-3.5 rounded-sm object-cover shrink-0" />
                    )}
                    <p className="text-gray-600 text-xs truncate">{listing.games.name}</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-auto pt-1.5">
                  <span className="text-accent font-bold text-sm tabular-nums">
                    {listing.price_amount} coin
                  </span>
                  <span className="text-gray-600 text-[10px]">
                    {new Date(listing.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-border px-3 py-2.5 flex gap-2">
                <Link
                  href={`/market/${listing.id}`}
                  className="flex-1 py-1.5 rounded border border-border text-gray-400 text-xs font-medium text-center hover:text-white hover:border-accent/50 transition-colors"
                >
                  View
                </Link>
                {listing.status === 'active' && (
                  <form action={async () => {
                    'use server'
                    await cancelListing(listing.id)
                  }}>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded border border-red-700/40 text-red-400 text-xs font-medium hover:bg-red-900/20 transition-colors"
                    >
                      Remove
                    </button>
                  </form>
                )}
              </div>
            </div>
          )})}
        </div>
      ) : (
        <div className="rounded border border-border bg-surface p-16 text-center space-y-3">
          <svg className="w-12 h-12 text-gray-700 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-gray-500 text-sm">
            {filter === 'all' ? 'No listings yet.' : `No ${filter} listings.`}
          </p>
          {filter === 'all' && (
            <Link href="/listings/new" className="inline-block text-accent text-sm hover:underline">
              Create your first listing →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
