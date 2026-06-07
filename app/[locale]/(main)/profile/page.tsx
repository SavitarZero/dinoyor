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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      <div className="flex items-start gap-4">
        {displayAvatar ? (
          <img src={displayAvatar} alt="" className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-black text-xl font-bold shrink-0">
            {displayName[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white truncate">{displayName}</h1>
            {isSeller && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent">Seller</span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{user.email}</p>
          {memberSince && <p className="text-gray-600 text-xs mt-0.5">Joined {memberSince}</p>}
        </div>
        <Link href="/profile/kyc" className="shrink-0 px-3 py-2 rounded-lg border border-border text-gray-400 text-xs font-medium hover:text-white hover:border-accent transition-colors">
          Settings
        </Link>
      </div>

      {profile?.kyc_status !== 'approved' && (
        <div className={`rounded-xl border p-4 flex items-center justify-between ${
          profile?.kyc_status === 'pending'
            ? 'border-yellow-800/50 bg-yellow-950/20'
            : 'border-border bg-surface'
        }`}>
          <div>
            <p className={`text-sm font-medium ${profile?.kyc_status === 'pending' ? 'text-yellow-400' : 'text-white'}`}>
              {profile?.kyc_status === 'pending' ? 'Verification in progress' : 'Verify your identity'}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              {profile?.kyc_status === 'pending'
                ? 'Usually takes 1–2 business days.'
                : 'Required to sell items on Dinoyor.'}
            </p>
          </div>
          {profile?.kyc_status !== 'pending' && (
            <Link href="/profile/kyc" className="px-4 py-2 rounded-lg bg-white text-black text-sm font-medium hover:bg-gray-200 transition-colors">
              Verify
            </Link>
          )}
        </div>
      )}

      {isSeller && (
        <div className="rounded-xl border border-border bg-surface">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-border">
            <div className="p-4 sm:p-5">
              <p className="text-gray-500 text-xs">Sales</p>
              <p className="text-xl font-bold text-white mt-1">{completedSales.length}</p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-gray-500 text-xs">Earnings</p>
              <p className="text-xl font-bold text-white mt-1">${totalEarnings.toFixed(0)}</p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-gray-500 text-xs">Listings</p>
              <p className="text-xl font-bold text-white mt-1">{activeListings ?? 0}</p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-gray-500 text-xs">Balance</p>
              <p className="text-xl font-bold text-white mt-1">${totalBalance.toFixed(2)}</p>
            </div>
          </div>
          {profile?.wallet_address && (
            <div className="border-t border-border px-5 py-3 flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-gray-500 text-xs">{profile.wallet_network} · </span>
                <span className="text-gray-400 text-xs font-mono">{profile.wallet_address.slice(0, 8)}...{profile.wallet_address.slice(-6)}</span>
              </div>
              <Link href="/wallet" className="text-accent text-xs hover:underline">Wallet →</Link>
            </div>
          )}
          {!profile?.wallet_address && (
            <div className="border-t border-border px-5 py-3 flex items-center justify-between">
              <p className="text-gray-500 text-xs">No payout wallet set</p>
              <Link href="/wallet" className="text-accent text-xs hover:underline">Set up →</Link>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-semibold">Orders</h2>
          <Link href="/orders" className="text-gray-500 text-xs hover:text-accent transition-colors">See all</Link>
        </div>
        {isSeller ? (
          <ProfileOrderTabs
            buyerOrders={(buyerOrders ?? []) as any}
            sellerOrders={sellerOrders as any}
          />
        ) : !buyerOrders?.length ? (
          <div className="rounded-xl border border-border bg-surface p-8 text-center">
            <p className="text-gray-500 text-sm">You haven't made any purchases yet.</p>
            <Link href="/market" className="mt-3 inline-block text-accent text-sm hover:underline">Browse market</Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface divide-y divide-border overflow-hidden">
            {buyerOrders.map((o: any) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
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
    </div>
  )
}
