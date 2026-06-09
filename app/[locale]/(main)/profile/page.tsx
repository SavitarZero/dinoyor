import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileContent } from '@/components/profile/ProfileContent'
import type { ProfileOrder } from '@/lib/types'

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
    supabase.from('profiles').select('username, avatar_url, kyc_status, role, wallet_address, wallet_network, deposit_wallet, deposit_wallet_network, pending_email, created_at').eq('id', user.id).single(),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'active'),
    supabase.from('seller_balances').select('pending_amount, currency').eq('seller_id', user.id),
    supabase.from('user_balances').select('balance').eq('user_id', user.id).eq('currency', 'USDT').maybeSingle(),
  ])

  const role = profile?.role ?? 'user'
  const isSeller = role === 'seller' || role === 'admin'

  const { data: buyerOrders } = await supabase
    .from('orders')
    .select('id, status, amount, created_at, listings(title, images)')
    .eq('buyer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  let sellerOrders: ProfileOrder[] = []
  if (isSeller) {
    const { data } = await supabase
      .from('orders')
      .select('id, status, amount, created_at, listings(title, images)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    sellerOrders = (data ?? []).map(o => ({
      id: String(o.id),
      status: String(o.status),
      amount: Number(o.amount),
      created_at: String(o.created_at),
      listings: Array.isArray(o.listings) ? (o.listings[0] ?? null) : o.listings,
    }))
  }

  let kycData = null
  if (profile?.kyc_status === 'approved' || profile?.kyc_status === 'pending') {
    const { data } = await supabase
      .from('kyc_submissions')
      .select('created_at, reviewed_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    kycData = data
  }

  const completedSales = sellerOrders.filter(o => o.status === 'completed')
  const hasRealEmail = !!(user.email && !user.email.endsWith('@dinoyor.internal'))
  const isOAuthOnly = !user.identities?.some(i => i.provider === 'email')

  const data = {
    displayName: profile?.username || user.email?.split('@')[0] || 'User',
    displayAvatar: profile?.avatar_url || (user.user_metadata?.avatar_url as string | undefined) || null,
    email: user.email ?? null,
    memberSince: profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      : null,
    isSeller,
    kycStatus: profile?.kyc_status ?? null,
    walletAddress: profile?.wallet_address ?? null,
    walletNetwork: profile?.wallet_network ?? null,
    depositWallet: profile?.deposit_wallet ?? null,
    depositWalletNetwork: profile?.deposit_wallet_network ?? null,
    amoBalance: Number(amoBalanceRow?.balance ?? 0),
    completedSales: completedSales.length,
    totalEarnings: completedSales.reduce((sum, o) => sum + Number(o.amount), 0),
    activeListings: activeListings ?? 0,
    totalBalance: balances?.reduce((sum, b) => sum + Number(b.pending_amount), 0) ?? 0,
    buyerOrders: (buyerOrders ?? []).map(o => ({
      id: String(o.id),
      status: String(o.status),
      amount: Number(o.amount),
      created_at: String(o.created_at),
      listings: Array.isArray(o.listings) ? (o.listings[0] ?? null) : o.listings,
    })) as ProfileOrder[],
    sellerOrders,
    kycSubmittedAt: kycData?.created_at ?? null,
    kycReviewedAt: kycData?.reviewed_at ?? null,
    hasRealEmail,
    currentEmail: hasRealEmail ? user.email! : null,
    pendingEmail: profile?.pending_email ?? null,
    isOAuthOnly,
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <ProfileContent data={data} />
    </div>
  )
}
