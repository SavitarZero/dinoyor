import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WalletAddressForm } from '@/components/wallet/WalletAddressForm'
import { requestPayout } from '@/lib/actions/payouts'
import type { SellerBalance, BalanceTransaction, Payout, Currency } from '@/lib/types'

function PayoutAction({
  hasWallet,
  hasPendingRequest,
  availableAmount,
  currency,
  minWithdraw,
}: Readonly<{
  hasWallet: boolean
  hasPendingRequest: boolean
  availableAmount: number
  currency: Currency
  minWithdraw: number
}>) {
  if (!hasWallet) return <p className="text-yellow-400 text-xs">Set payout wallet first</p>
  if (hasPendingRequest) return (
    <span className="inline-block px-3 py-1.5 rounded-full bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 text-xs font-medium">
      Payout request pending approval
    </span>
  )
  if (availableAmount > 0) return (
    <div className="flex items-center gap-2">
      <form action={async () => {
        'use server'
        await requestPayout(currency)
      }}>
        <button className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-semibold hover:opacity-90">
          Request Payout
        </button>
      </form>
      <span className="text-gray-600 text-xs">Min. {minWithdraw} coin</span>
    </div>
  )
  return null
}

export default async function EarningsPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const { data: profileRole } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profileRole?.role ?? 'user'
  if (role !== 'seller' && role !== 'admin') redirect('/wallet')

  const [
    { data: profile },
    { data: sellerBalances },
    { data: payouts },
    { data: txLog },
    { data: payoutRequests },
    { data: settings },
    { count: completedSalesCount },
  ] = await Promise.all([
    supabase.from('profiles').select('wallet_address, wallet_network, kyc_status').eq('id', user.id).single(),
    supabase.from('seller_balances').select('*').eq('seller_id', user.id),
    supabase.from('payouts').select('*').eq('seller_id', user.id).order('processed_at', { ascending: false }),
    supabase.from('balance_transactions').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('payout_requests').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
    supabase.from('platform_settings').select('key, value').in('key', ['min_withdraw_amo']),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'completed'),
  ])

  const pendingRequests = payoutRequests?.filter(r => r.status === 'pending') ?? []
  const minWithdraw = Number(Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))['min_withdraw_amo'] ?? 200)

  const typedSellerBalances = (sellerBalances ?? []) as unknown as SellerBalance[]
  const typedTxLog = (txLog ?? []) as unknown as BalanceTransaction[]
  const typedPayouts = (payouts ?? []) as unknown as Payout[]

  // Aggregate totals across all currencies (typically just USDT)
  const totalAvailable = typedSellerBalances.reduce((s, b) => s + Number(b.available_amount ?? 0), 0)
  const totalPending   = typedSellerBalances.reduce((s, b) => s + Number(b.pending_amount   ?? 0), 0)
  const primaryCurrency: Currency = (typedSellerBalances[0]?.currency as Currency) ?? 'USDT'
  const hasPendingRequest = pendingRequests.length > 0
  const hasWallet = !!profile?.wallet_address

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-white text-xl font-bold mb-6">Earnings</h1>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          {/* Balance cards — always visible */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-green-700/30 bg-green-900/10 p-5 flex flex-col gap-1">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Available</p>
              <p className="text-3xl font-bold text-green-400">
                {totalAvailable.toFixed(2)}
                <span className="text-base text-green-600 ml-1.5">USDT</span>
              </p>
              <p className="text-gray-600 text-xs">Ready to withdraw</p>
            </div>
            <div className="rounded-xl border border-yellow-700/30 bg-yellow-900/10 p-5 flex flex-col gap-1">
              <p className="text-gray-500 text-xs uppercase tracking-wide">On Hold</p>
              <p className="text-3xl font-bold text-yellow-400">
                {totalPending.toFixed(2)}
                <span className="text-base text-yellow-600 ml-1.5">USDT</span>
              </p>
              <p className="text-gray-600 text-xs">Released after 7 days</p>
            </div>
          </div>

          {/* Payout action */}
          <div className="rounded-xl border border-border bg-surface px-5 py-4">
            <PayoutAction
              hasWallet={hasWallet}
              hasPendingRequest={hasPendingRequest}
              availableAmount={totalAvailable}
              currency={primaryCurrency}
              minWithdraw={minWithdraw}
            />
          </div>

          {/* Withdraw requirements */}
          <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Withdraw Requirements</p>
            <div className="space-y-2">
              {[
                {
                  met: profile?.kyc_status === 'approved',
                  label: 'KYC Verified',
                  action: profile?.kyc_status === 'approved' ? null : { href: '/profile/kyc', text: 'Verify →' },
                },
                {
                  met: !!profile?.wallet_address,
                  label: 'Withdraw wallet set',
                  action: profile?.wallet_address ? null : { href: '/profile#withdraw-wallet', text: 'Set wallet →' },
                },
                {
                  met: (completedSalesCount ?? 0) >= 1,
                  label: 'At least 1 completed sale',
                  action: null,
                },
              ].map(({ met, label, action }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${met ? 'text-green-400' : 'text-red-400'}`}>{met ? '✓' : '✗'}</span>
                    <span className={`text-sm ${met ? 'text-gray-300' : 'text-gray-500'}`}>{label}</span>
                  </div>
                  {action && (
                    <Link href={action.href} className="text-accent text-xs hover:underline">{action.text}</Link>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payout wallet */}
          <div className="rounded border border-border bg-surface">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-white text-sm font-semibold">Payout Wallet</p>
              <p className="text-gray-500 text-xs">Withdraw address — coin from your sales will be sent here.</p>
            </div>
            <div className="px-4 py-4">
              <WalletAddressForm currentAddress={profile?.wallet_address ?? null} currentNetwork={profile?.wallet_network ?? null} />
            </div>
          </div>

        </div>

        <div className="space-y-5">
          {/* Earnings history */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-white text-sm font-medium">Earnings History</p>
            </div>
            {typedTxLog.length ? (
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {typedTxLog.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'credit' ? '+' : '-'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-white text-sm">{Number(tx.amount).toFixed(2)} coin</p>
                        <p className="text-gray-600 text-xs truncate">{tx.note}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-gray-600 text-xs">
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                      {tx.order_id && <Link href={`/orders/${tx.order_id}`} className="text-accent text-xs hover:underline">View</Link>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center"><p className="text-gray-600 text-xs">No transactions yet</p></div>
            )}
          </div>

          {/* Payouts */}
          <div className="rounded-xl border border-border bg-surface">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-white text-sm font-medium">Payouts</p>
            </div>
            {typedPayouts.length ? (
              <div className="divide-y divide-border">
                {typedPayouts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">{Number(p.amount).toFixed(2)} coin</p>
                      <p className="text-gray-600 text-xs font-mono truncate">{p.wallet_address?.slice(0, 10)}…</p>
                    </div>
                    <p className="text-gray-600 text-xs shrink-0">
                      {new Date(p.processed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center"><p className="text-gray-600 text-xs">No payouts yet</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
