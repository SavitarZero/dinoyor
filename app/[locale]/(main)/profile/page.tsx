import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileOrderTabs } from '@/components/profile/ProfileOrderTabs'
import { WalletAddressForm } from '@/components/wallet/WalletAddressForm'
import { DepositWalletForm } from '@/components/wallet/DepositWalletForm'

function kycNavClass(status: string | null | undefined) {
  if (status === 'approved') return 'text-green-400 hover:text-green-300'
  if (status === 'pending')  return 'text-yellow-400 hover:text-yellow-300'
  return 'text-accent hover:text-accent/80'
}

function KycNavBadge({ status }: Readonly<{ status: string | null | undefined }>) {
  if (status === 'approved') return <span className="text-[10px] font-bold bg-green-400/10 text-green-400 px-1.5 py-0.5 rounded-full">Done</span>
  if (status === 'pending')  return <span className="text-[10px] font-bold bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded-full">Review</span>
  return <span className="text-[10px] font-bold bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">Required</span>
}

function KycCard({ status }: Readonly<{ status: string | null | undefined }>) {
  if (status === 'approved') {
    return (
      <div className="rounded-2xl border border-green-700/30 bg-green-950/10 p-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-green-400 text-sm font-semibold">Identity Verified</p>
          <p className="text-gray-500 text-xs">You can buy and sell on Ammonite.</p>
        </div>
        <Link href="/profile/kyc" className="text-gray-500 text-xs hover:text-accent transition-colors shrink-0">View →</Link>
      </div>
    )
  }
  if (status === 'pending') {
    return (
      <div className="rounded-2xl border border-yellow-700/40 bg-yellow-950/20 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-yellow-400 text-sm font-semibold">Verification in progress</p>
          <p className="text-gray-400 text-xs mt-0.5">Our team is reviewing your submission — usually 1–2 business days.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
        <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-semibold">Verify your identity</p>
        <p className="text-gray-400 text-xs mt-0.5">Required to buy and sell items on Ammonite. Takes less than 5 minutes.</p>
      </div>
      <Link href="/profile/kyc" className="sm:shrink-0 px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-bold hover:opacity-90 text-center">
        Verify now
      </Link>
    </div>
  )
}

function orderStatusColor(status: string) {
  if (status === 'completed') return 'text-green-400'
  if (status === 'cancelled') return 'text-gray-500'
  if (status === 'disputed')  return 'text-red-400'
  return 'text-gray-400'
}

function BuyerOrderList({ orders }: Readonly<{ orders: any[] }>) {
  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-gray-500 text-sm">No orders yet.</p>
        <Link href="/market" className="mt-2 inline-block text-accent text-sm hover:underline">Browse market →</Link>
      </div>
    )
  }
  return (
    <div className="rounded-2xl border border-border bg-surface divide-y divide-border overflow-hidden">
      {orders.map((o: any) => (
        <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-colors">
          <div className="w-10 h-10 rounded-lg overflow-hidden bg-background shrink-0">
            {o.listings?.images?.[0]
              ? <img src={o.listings.images[0]} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-background" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm truncate">{o.listings?.title ?? 'Untitled'}</p>
            <p className="text-gray-600 text-xs">
              {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-white text-sm font-medium">{Number(o.amount).toFixed(2)} coin</p>
            <p className={`text-xs capitalize ${orderStatusColor(o.status)}`}>
              {o.status.replaceAll('_', ' ')}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const [
    { data: profile },
    { count: activeListings },
    { data: balances },
    { data: amoBalanceRow },
  ] = await Promise.all([
    supabase.from('profiles').select('username, avatar_url, kyc_status, role, wallet_address, wallet_network, deposit_wallet, deposit_wallet_network, created_at').eq('id', user.id).single(),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'active'),
    supabase.from('seller_balances').select('pending_amount, currency').eq('seller_id', user.id),
    supabase.from('user_balances').select('balance').eq('user_id', user.id).eq('currency', 'USDT').maybeSingle(),
  ])

  const amoBalance = Number(amoBalanceRow?.balance ?? 0)

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

  const kycStatus = profile?.kyc_status

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-4">

            {/* User card */}
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface">
              {displayAvatar
                ? <img src={displayAvatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                : (
                  <div className="w-11 h-11 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm font-black shrink-0">
                    {displayName[0].toUpperCase()}
                  </div>
                )
              }
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate">{displayName}</p>
                {memberSince && <p className="text-gray-600 text-xs">Joined {memberSince}</p>}
              </div>
            </div>

            {/* Navigation */}
            <nav className="rounded-2xl border border-border bg-surface overflow-hidden">
              <a href="#identity" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/2 transition-colors border-l-2 border-transparent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                <span className="flex-1">Identity</span>
                <KycNavBadge status={kycStatus} />
              </a>
              <a href="#wallet-settings" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/2 transition-colors border-l-2 border-transparent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Wallet Settings
              </a>
              <a href="#recent-orders" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/2 transition-colors border-l-2 border-transparent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Recent Orders
              </a>
            </nav>

          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-6">

          <div id="identity">
            <KycCard status={kycStatus} />
          </div>

          {/* Wallet Settings */}
          <div id="wallet-settings" className="rounded-2xl border border-border bg-surface">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-white text-sm font-semibold">Wallet Settings</p>
            </div>
            <div className="p-4 space-y-6">
              {/* Deposit sender address */}
              <div className="space-y-2">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Deposit Sender Address</p>
                <p className="text-gray-600 text-xs">The wallet address you send coin from. Must be set before depositing.</p>
                <div id="deposit-wallet">
                  <DepositWalletForm
                    currentAddress={profile?.deposit_wallet ?? null}
                    currentNetwork={profile?.deposit_wallet_network ?? null}
                  />
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Withdraw wallet — seller only */}
              <div className="space-y-2" id="withdraw-wallet">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wide">Withdraw Wallet (Seller Payout)</p>
                <p className="text-gray-600 text-xs">coin from your sales will be sent to this address.</p>
                <WalletAddressForm
                  currentAddress={profile?.wallet_address ?? null}
                  currentNetwork={profile?.wallet_network ?? null}
                />
              </div>
            </div>
          </div>

          {/* coin balance — buyers */}
          {!isSeller && (
            <div className="rounded-2xl border border-border bg-surface p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-gray-500 text-xs">coin Balance</p>
                <p className="text-2xl font-bold text-accent mt-0.5">{amoBalance.toFixed(2)} <span className="text-base font-medium text-gray-500">coin</span></p>
              </div>
              <Link href="/wallet" className="px-4 py-1.5 rounded-lg border border-border text-gray-400 text-xs font-bold hover:text-white hover:border-accent/50 transition-colors shrink-0">
                Deposit →
              </Link>
            </div>
          )}

          {isSeller && (
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-border">
                {[
                  { label: 'coin Balance', value: `${amoBalance.toFixed(2)} coin`, accent: true },
                  { label: 'Sales',       value: String(completedSales.length) },
                  { label: 'Earnings',    value: `${totalEarnings.toFixed(0)} coin` },
                  { label: 'Listings',    value: String(activeListings ?? 0) },
                  { label: 'Pending',     value: `${totalBalance.toFixed(2)} coin` },
                ].map(({ label, value, accent }) => (
                  <div key={label} className="p-4">
                    <p className="text-gray-500 text-xs">{label}</p>
                    <p className={`text-xl font-bold mt-0.5 ${accent ? 'text-accent' : 'text-white'}`}>{value}</p>
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
          <div id="recent-orders">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white text-base font-bold">Recent Orders</h2>
              <Link href="/orders" className="text-gray-500 text-xs hover:text-accent transition-colors">View all</Link>
            </div>
            {isSeller
              ? <ProfileOrderTabs buyerOrders={(buyerOrders ?? []) as any} sellerOrders={sellerOrders as any} />
              : <BuyerOrderList orders={buyerOrders ?? []} />
            }
          </div>

        </main>
      </div>
    </div>
  )
}
