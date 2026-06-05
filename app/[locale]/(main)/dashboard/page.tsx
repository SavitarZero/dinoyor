import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, kyc_status, role')
    .eq('id', user.id)
    .single()

  const [{ count: activeListings }, { count: pendingOrders }] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id).eq('status', 'active'),
    supabase.from('orders').select('*', { count: 'exact', head: true })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .in('status', ['paid_escrow', 'delivered', 'disputed']),
  ])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">
        Welcome back{profile?.username ? `, ${profile.username}` : ''}
      </h1>
      <p className="text-gray-500 text-sm mb-8">{user.email}</p>

      {profile?.kyc_status !== 'approved' && (
        <div className="mb-6 rounded-xl border border-yellow-700 bg-yellow-900/20 p-4 flex items-center justify-between">
          <div>
            <p className="text-yellow-400 font-medium text-sm">Identity not verified</p>
            <p className="text-gray-400 text-xs mt-0.5">Verify your identity to start selling items.</p>
          </div>
          <Link href="/profile/kyc" className="px-3 py-1 rounded-lg bg-yellow-600 text-white text-sm font-medium">
            Verify Now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-gray-500 text-sm">Active Listings</p>
          <p className="text-2xl font-bold text-white mt-1">{activeListings ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-gray-500 text-sm">Pending Orders</p>
          <p className="text-2xl font-bold text-white mt-1">{pendingOrders ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-gray-500 text-sm">KYC Status</p>
          <p className="text-sm font-semibold mt-1 capitalize"
            style={{ color: profile?.kyc_status === 'approved' ? '#4ade80' : profile?.kyc_status === 'pending' ? '#facc15' : '#9ca3af' }}>
            {profile?.kyc_status ?? 'none'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/listings" className="p-4 rounded-xl border border-border bg-surface hover:border-accent transition-colors text-center">
          <p className="text-white font-medium">Browse Marketplace</p>
        </Link>
        <Link href="/listings/new" className="p-4 rounded-xl border border-border bg-surface hover:border-accent transition-colors text-center">
          <p className="text-white font-medium">Sell an Item</p>
        </Link>
        <Link href="/orders" className="p-4 rounded-xl border border-border bg-surface hover:border-accent transition-colors text-center">
          <p className="text-white font-medium">My Orders</p>
        </Link>
        <Link href="/wallet" className="p-4 rounded-xl border border-border bg-surface hover:border-accent transition-colors text-center">
          <p className="text-white font-medium">Wallet</p>
        </Link>
      </div>
    </div>
  )
}
