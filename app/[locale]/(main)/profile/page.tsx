import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ListingWithGame, OrderWithDetails } from '@/lib/types/index'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) || null

  const [
    { data: profile },
    { count: activeListings },
    { count: pendingOrders },
    { data: recentListings },
    { data: recentOrders },
    { data: balances },
  ] = await Promise.all([
    supabase.from('profiles').select('username, avatar_url, kyc_status, role').eq('id', user.id).single(),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'active'),
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .in('status', ['paid_escrow', 'delivered', 'disputed']),
    supabase.from('listings')
      .select('id, title, price_amount, price_currency, images, status, seller_id, games(name, slug, logo_url)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('orders')
      .select('id, amount, currency, status, created_at, listings(title, images), buyer:buyer_id(username), seller:seller_id(username)')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false })
      .limit(3),
    supabase.from('seller_balances').select('pending_amount, currency').eq('seller_id', user.id),
  ])

  const displayAvatar = profile?.avatar_url || avatarUrl
  const displayName = profile?.username || user.email?.split('@')[0] || 'User'

  const kycColor = profile?.kyc_status === 'approved'
    ? 'text-green-400' : profile?.kyc_status === 'pending'
    ? 'text-yellow-400' : 'text-gray-500'

  const orderStatusColor: Record<string, string> = {
    awaiting_payment: 'text-gray-400',
    paid_escrow: 'text-yellow-400',
    delivered: 'text-blue-400',
    completed: 'text-green-400',
    disputed: 'text-red-400',
    cancelled: 'text-gray-500',
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-4">
        {displayAvatar ? (
          <img src={displayAvatar} alt="avatar" className="w-14 h-14 rounded-full object-cover ring-2 ring-border" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-black text-xl font-bold">
            {displayName[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {displayName}</h1>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>
      </div>

      {/* KYC Banner */}
      {profile?.kyc_status !== 'approved' && (
        <div className="rounded-xl border border-yellow-700/50 bg-yellow-900/10 p-4 flex items-center justify-between">
          <div>
            <p className="text-yellow-400 font-medium text-sm">Identity not verified</p>
            <p className="text-gray-400 text-xs mt-0.5">Verify to start selling items on Dinoyor.</p>
          </div>
          <Link href="/profile/kyc" className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium transition-colors">
            Verify Now
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Active Listings</p>
          <p className="text-3xl font-bold text-white mt-2">{activeListings ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Pending Orders</p>
          <p className="text-3xl font-bold text-white mt-2">{pendingOrders ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wide">KYC Status</p>
          <p className={`text-sm font-semibold mt-2 capitalize ${kycColor}`}>
            {profile?.kyc_status ?? 'none'}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Balance</p>
          {balances && balances.length > 0 ? (
            <div className="mt-2 space-y-0.5">
              {balances.map(b => (
                <p key={b.currency} className="text-white font-semibold text-sm">
                  {b.pending_amount} <span className="text-gray-500">{b.currency}</span>
                </p>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm mt-2">—</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: '/market', label: 'Browse Market', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
          { href: '/listings/new', label: 'Sell an Item', icon: 'M12 4v16m8-8H4' },
          { href: '/orders', label: 'My Orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
          { href: '/wallet', label: 'Wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-surface hover:border-accent transition-colors text-center group"
          >
            <svg className="w-5 h-5 text-gray-500 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
            </svg>
            <p className="text-white text-sm font-medium">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">

        {/* Recent Listings */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">My Listings</h2>
            <Link href="/market" className="text-accent text-xs hover:underline">See all</Link>
          </div>
          {recentListings && recentListings.length > 0 ? (
            <div className="space-y-2">
              {(recentListings as unknown as ListingWithGame[]).map(l => (
                <Link
                  key={l.id}
                  href={`/market/${l.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:border-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-background shrink-0">
                    {l.images[0] ? (
                      <img src={l.images[0]} alt={l.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">?</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{l.title}</p>
                    <p className="text-gray-500 text-xs">{l.games?.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-accent text-sm font-semibold">{l.price_amount} {l.price_currency}</p>
                    <p className={`text-xs capitalize ${l.status === 'active' ? 'text-green-400' : 'text-gray-500'}`}>{l.status}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-6 text-center">
              <p className="text-gray-500 text-sm">No listings yet</p>
              <Link href="/listings/new" className="mt-2 inline-block text-accent text-sm hover:underline">Post your first item</Link>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">Recent Orders</h2>
            <Link href="/orders" className="text-accent text-xs hover:underline">See all</Link>
          </div>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-2">
              {(recentOrders as unknown as OrderWithDetails[]).map(o => (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-surface hover:border-accent transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-background shrink-0">
                    {o.listings?.images?.[0] ? (
                      <img src={o.listings.images[0]} alt={o.listings.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">?</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{o.listings?.title}</p>
                    <p className={`text-xs capitalize ${orderStatusColor[o.status] ?? 'text-gray-400'}`}>{o.status.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white text-sm font-semibold">{o.amount} {o.currency}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface p-6 text-center">
              <p className="text-gray-500 text-sm">No orders yet</p>
              <Link href="/market" className="mt-2 inline-block text-accent text-sm hover:underline">Browse market</Link>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
