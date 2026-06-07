import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileOrderTabs } from '@/components/profile/ProfileOrderTabs'

const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: 'Awaiting Payment',
  paid_escrow: 'In Escrow',
  delivered: 'Delivered',
  completed: 'Completed',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
}

const STATUS_STYLE: Record<string, string> = {
  awaiting_payment: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/40',
  paid_escrow: 'bg-blue-900/30 text-blue-400 border-blue-700/40',
  delivered: 'bg-purple-900/30 text-purple-400 border-purple-700/40',
  completed: 'bg-green-900/30 text-green-400 border-green-700/40',
  disputed: 'bg-red-900/30 text-red-400 border-red-700/40',
  cancelled: 'bg-surface text-gray-500 border-border',
}

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
    ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-accent/20 via-accent/5 to-transparent" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            {displayAvatar ? (
              <img src={displayAvatar} alt="avatar" className="w-20 h-20 rounded-2xl object-cover ring-4 ring-surface shadow-xl" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-black text-2xl font-bold ring-4 ring-surface shadow-xl">
                {displayName[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">{displayName}</h1>
                {isSeller && (
                  <span className="px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-medium">
                    Seller
                  </span>
                )}
                {role === 'admin' && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 text-xs font-medium">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm truncate">{user.email}</p>
              {memberSince && (
                <p className="text-gray-600 text-xs mt-0.5">Member since {memberSince}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href="/orders" className="px-4 py-2.5 rounded-xl border border-border text-gray-400 text-sm font-medium hover:text-white hover:border-accent transition-colors">
                My Orders
              </Link>
              {isSeller && (
                <Link href="/wallet" className="px-4 py-2.5 rounded-xl bg-accent text-black text-sm font-semibold hover:opacity-90 transition-opacity">
                  Wallet
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              profile?.kyc_status === 'approved' ? 'bg-green-900/30' : profile?.kyc_status === 'pending' ? 'bg-yellow-900/30' : 'bg-surface border border-border'
            }`}>
              {profile?.kyc_status === 'approved' ? (
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              ) : profile?.kyc_status === 'pending' ? (
                <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                </svg>
              )}
            </div>
            <div>
              <p className="text-white font-medium text-sm">Identity Verification</p>
              {profile?.kyc_status === 'approved' ? (
                <p className="text-green-400 text-xs">Verified — you can sell items</p>
              ) : profile?.kyc_status === 'pending' ? (
                <p className="text-yellow-400 text-xs">Under review — usually 1–2 business days</p>
              ) : profile?.kyc_status === 'rejected' ? (
                <p className="text-red-400 text-xs">Rejected — please resubmit</p>
              ) : (
                <p className="text-gray-500 text-xs">Required to list items for sale</p>
              )}
            </div>
          </div>
          {(!profile?.kyc_status || profile.kyc_status === 'none' || profile.kyc_status === 'rejected') && (
            <Link
              href="/profile/kyc"
              className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Verify
            </Link>
          )}
        </div>
      </div>

      {isSeller && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-surface p-4 space-y-1">
            <div className="w-8 h-8 rounded-lg bg-green-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white">{totalEarnings.toFixed(0)}</p>
            <p className="text-gray-500 text-xs">Earnings (USDT)</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 space-y-1">
            <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white">{completedSales.length}</p>
            <p className="text-gray-500 text-xs">Completed Sales</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 space-y-1">
            <div className="w-8 h-8 rounded-lg bg-purple-900/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0h18" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white">{activeListings ?? 0}</p>
            <p className="text-gray-500 text-xs">Active Listings</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-4 space-y-1">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-white">{totalBalance.toFixed(2)}</p>
            <p className="text-gray-500 text-xs">Balance (USDT)</p>
          </div>
        </div>
      )}

      {isSeller && profile?.wallet_address && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium text-sm">Payout Wallet</p>
                <p className="text-gray-500 text-xs">{profile.wallet_network}</p>
                <p className="text-gray-400 text-xs font-mono truncate">{profile.wallet_address}</p>
              </div>
            </div>
            <Link href="/wallet" className="px-3 py-1.5 rounded-lg border border-border text-gray-400 text-xs font-medium hover:text-white hover:border-accent transition-colors shrink-0">
              Manage
            </Link>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">Recent Orders</h2>
          <Link href="/orders" className="text-accent text-sm hover:underline">View all →</Link>
        </div>
        {isSeller ? (
          <ProfileOrderTabs
            buyerOrders={(buyerOrders ?? []) as any}
            sellerOrders={sellerOrders as any}
          />
        ) : !buyerOrders?.length ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No orders yet</p>
            <Link href="/market" className="inline-block text-accent text-sm hover:underline">Browse market →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {buyerOrders.map((o: any) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:border-accent transition-all group"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-background shrink-0">
                  {o.listings?.images?.[0] ? (
                    <img src={o.listings.images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate group-hover:text-accent transition-colors">{o.listings?.title ?? 'Untitled'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[o.status] ?? 'bg-surface text-gray-500 border-border'}`}>
                      {STATUS_LABEL[o.status] ?? o.status}
                    </span>
                    <span className="text-gray-600 text-xs">
                      {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <p className="text-white font-bold text-sm">{Number(o.amount).toFixed(2)}</p>
                    <p className="text-gray-500 text-xs">USDT</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
