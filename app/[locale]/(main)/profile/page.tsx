import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileOrderTabs } from '@/components/profile/ProfileOrderTabs'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, kyc_status, role, wallet_address, wallet_network')
    .eq('id', user.id)
    .single()

  const role = profile?.role ?? 'user'
  const isSeller = role === 'seller' || role === 'admin'

  const { data: buyerOrders } = await supabase
    .from('orders')
    .select('id, status, amount, created_at, listings(title)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  let sellerOrders: any[] = []
  if (isSeller) {
    const { data } = await supabase
      .from('orders')
      .select('id, status, amount, created_at, listings(title)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    sellerOrders = data ?? []
  }

  const completedSales = sellerOrders.filter(o => o.status === 'completed')
  const totalEarnings = completedSales.reduce((sum, o) => sum + Number(o.amount), 0)

  const displayAvatar = profile?.avatar_url || (user.user_metadata?.avatar_url as string | undefined) || null
  const displayName = profile?.username || user.email?.split('@')[0] || 'User'

  const statusColor: Record<string, string> = {
    awaiting_payment: 'text-gray-400',
    paid_escrow: 'text-yellow-400',
    delivered: 'text-blue-400',
    completed: 'text-green-400',
    disputed: 'text-red-400',
    cancelled: 'text-gray-500',
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

      <div className="flex items-center gap-4">
        {displayAvatar ? (
          <img src={displayAvatar} alt="avatar" className="w-14 h-14 rounded-full object-cover ring-2 ring-border" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center text-black text-xl font-bold">
            {displayName[0].toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">{displayName}</h1>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <p className="text-white font-semibold">KYC Status</p>
          {profile?.kyc_status === 'approved' ? (
            <span className="px-3 py-1 rounded-full bg-green-900/30 border border-green-700/40 text-green-400 text-xs font-medium">
              Approved ✓
            </span>
          ) : profile?.kyc_status === 'pending' ? (
            <span className="px-3 py-1 rounded-full bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 text-xs font-medium">
              Pending review
            </span>
          ) : (
            <Link
              href="/profile/kyc"
              className="px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-medium transition-colors"
            >
              Verify Now
            </Link>
          )}
        </div>
        {profile?.kyc_status === 'pending' && (
          <p className="text-gray-500 text-xs mt-2">Your documents are being reviewed. This usually takes 1–2 business days.</p>
        )}
        {(!profile?.kyc_status || profile.kyc_status === 'none' || profile.kyc_status === 'rejected') && (
          <p className="text-gray-500 text-xs mt-2">Verify your identity to start selling on Dinoyor.</p>
        )}
      </div>

      {isSeller && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Total Sales</p>
              <p className="text-3xl font-bold text-white mt-2">{completedSales.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Total Earnings</p>
              <p className="text-3xl font-bold text-white mt-2">
                {totalEarnings.toFixed(2)} <span className="text-lg text-gray-500">USDT</span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold">Payout Wallet</p>
                {profile?.wallet_address ? (
                  <div className="mt-1">
                    <p className="text-gray-500 text-xs">{profile.wallet_network}</p>
                    <p className="text-white text-sm font-mono break-all">{profile.wallet_address}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs mt-1">No wallet address set</p>
                )}
              </div>
              <Link href="/wallet" className="px-3 py-1.5 rounded-lg border border-border text-gray-400 text-xs font-medium hover:text-white hover:border-accent transition-colors">
                {profile?.wallet_address ? 'Change' : 'Set up'}
              </Link>
            </div>
          </div>
        </>
      )}

      <div>
        <h2 className="text-white font-semibold mb-3">Order History</h2>
        {isSeller ? (
          <ProfileOrderTabs
            buyerOrders={(buyerOrders ?? []) as any}
            sellerOrders={sellerOrders as any}
          />
        ) : !buyerOrders?.length ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-center">
            <p className="text-gray-500 text-sm">No orders yet.</p>
            <Link href="/market" className="mt-2 inline-block text-accent text-sm hover:underline">Browse market</Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface divide-y divide-border">
            {buyerOrders.map((o: any) => (
              <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                <div>
                  <p className="text-white text-sm font-medium">{o.listings?.title ?? 'Untitled'}</p>
                  <p className={`text-xs capitalize ${statusColor[o.status] ?? 'text-gray-400'}`}>{o.status.replace(/_/g, ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-white text-sm font-semibold">{Number(o.amount).toFixed(2)} USDT</p>
                  <p className="text-gray-500 text-xs">
                    {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
