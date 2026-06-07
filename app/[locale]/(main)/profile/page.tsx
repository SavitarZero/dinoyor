import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileOrderTabs } from '@/components/profile/ProfileOrderTabs'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { count: activeListings },
    { data: balances },
  ] = await Promise.all([
    supabase.from('profiles').select('username, avatar_url, kyc_status, role, wallet_address, wallet_network, created_at').eq('id', user.id).single(),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'active'),
    supabase.from('seller_balances').select('pending_amount, currency').eq('seller_id', user.id),
  ])

  const role = profile?.role ?? 'user'
  const isSeller = role === 'seller' || role === 'admin'

  const { data: buyerOrders } = await supabase
    .from('orders')
    .select('id, status, amount, created_at, listings(title, images)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  let sellerOrders: any[] = []
  if (isSeller) {
    const { data } = await supabase
      .from('orders')
      .select('id, status, amount, created_at, listings(title, images)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    sellerOrders = data ?? []
  }

  const completedSales = sellerOrders.filter(o => o.status === 'completed')
  const totalEarnings = completedSales.reduce((sum, o) => sum + Number(o.amount), 0)
  const totalBalance = balances?.reduce((sum, b) => sum + Number(b.pending_amount), 0) ?? 0

  const displayAvatar = profile?.avatar_url || (user.user_metadata?.avatar_url as string | undefined) || null
  const displayName = profile?.username || user.email?.split('@')[0] || 'User'
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : null

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-4">

            {/* User card */}
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface">
              {displayAvatar ? (
                <img src={displayAvatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm font-black shrink-0">
                  {displayName[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate">{displayName}</p>
                {memberSince && <p className="text-gray-600 text-xs">Joined {memberSince}</p>}
              </div>
            </div>

            {/* Navigation */}
            <nav className="rounded-2xl border border-border bg-surface overflow-hidden">
              <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-white bg-white/[0.03] border-l-2 border-accent">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Overview
              </Link>
              <Link href="/orders" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/[0.02] transition-colors border-l-2 border-transparent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Orders
              </Link>
              <Link href="/profile/email" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/[0.02] transition-colors border-l-2 border-transparent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </Link>
              {isSeller && (
                <Link href="/wallet" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/[0.02] transition-colors border-l-2 border-transparent">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Wallet
                </Link>
              )}
              <Link href="/profile/kyc" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/[0.02] transition-colors border-l-2 border-transparent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </nav>

          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-6">

          {profile?.kyc_status !== 'approved' && (
            <div className={`rounded-2xl border p-4 flex items-center justify-between ${
              profile?.kyc_status === 'pending'
                ? 'border-yellow-700/40 bg-yellow-950/20'
                : 'border-border bg-surface'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                  profile?.kyc_status === 'pending' ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-accent/10 border-accent/20'
                }`}>
                  <svg className={`w-4 h-4 ${profile?.kyc_status === 'pending' ? 'text-yellow-400' : 'text-accent'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className={`text-sm font-semibold ${profile?.kyc_status === 'pending' ? 'text-yellow-400' : 'text-white'}`}>
                    {profile?.kyc_status === 'pending' ? 'Verification in progress' : 'Verify your identity'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {profile?.kyc_status === 'pending' ? 'Usually takes 1–2 business days.' : 'Required to sell items on Dinoyor.'}
                  </p>
                </div>
              </div>
              {profile?.kyc_status !== 'pending' && (
                <Link href="/profile/kyc" className="px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-bold hover:opacity-90 transition-opacity">
                  Verify
                </Link>
              )}
            </div>
          )}

          {isSeller && (
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
                {[
                  { label: 'Sales', value: String(completedSales.length) },
                  { label: 'Earnings', value: `$${totalEarnings.toFixed(0)}` },
                  { label: 'Listings', value: String(activeListings ?? 0) },
                  { label: 'Balance', value: `$${totalBalance.toFixed(2)}` },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4">
                    <p className="text-gray-500 text-xs">{label}</p>
                    <p className="text-xl font-bold text-white mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
              {profile?.wallet_address && (
                <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-gray-500 text-xs">{profile.wallet_network} · </span>
                    <span className="text-gray-400 text-xs font-mono">{profile.wallet_address.slice(0, 8)}...{profile.wallet_address.slice(-6)}</span>
                  </div>
                  <Link href="/wallet" className="text-accent text-xs hover:underline">Manage →</Link>
                </div>
              )}
            </div>
          )}

          {/* Orders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white text-base font-bold">Recent Orders</h2>
              <Link href="/orders" className="text-gray-500 text-xs hover:text-accent transition-colors">View all</Link>
            </div>

            {isSeller ? (
              <ProfileOrderTabs
                buyerOrders={(buyerOrders ?? []) as any}
                sellerOrders={sellerOrders as any}
              />
            ) : !buyerOrders?.length ? (
              <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                <p className="text-gray-500 text-sm">No orders yet.</p>
                <Link href="/market" className="mt-2 inline-block text-accent text-sm hover:underline">Browse market →</Link>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
                {buyerOrders.map((o: any) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-background shrink-0">
                      {o.listings?.images?.[0] ? (
                        <img src={o.listings.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{o.listings?.title ?? 'Untitled'}</p>
                      <p className="text-gray-600 text-xs">
                        {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-white text-sm font-medium">${Number(o.amount).toFixed(2)}</p>
                      <p className={`text-xs capitalize ${
                        o.status === 'completed' ? 'text-green-400' :
                        o.status === 'cancelled' ? 'text-gray-500' :
                        o.status === 'disputed' ? 'text-red-400' : 'text-gray-400'
                      }`}>{o.status.replace(/_/g, ' ')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  )
}
