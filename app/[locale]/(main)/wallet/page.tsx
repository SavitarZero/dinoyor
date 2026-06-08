import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WalletAddressForm } from '@/components/wallet/WalletAddressForm'
import { DepositForm } from '@/components/wallet/DepositForm'
import { requestPayout } from '@/lib/actions/payouts'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: sellerBalances },
    { data: payouts },
    { data: txLog },
    { data: payoutRequests },
    { data: userBalance },
    { data: deposits },
    { data: settings },
    { count: completedSalesCount },
  ] = await Promise.all([
    supabase.from('profiles').select('wallet_address, wallet_network, deposit_wallet, kyc_status').eq('id', user.id).single(),
    supabase.from('seller_balances').select('*').eq('seller_id', user.id),
    supabase.from('payouts').select('*').eq('seller_id', user.id).order('processed_at', { ascending: false }),
    supabase.from('balance_transactions').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('payout_requests').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
    supabase.from('user_balances').select('balance, currency').eq('user_id', user.id).maybeSingle(),
    supabase.from('deposit_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('platform_settings').select('key, value').in('key', ['escrow_wallet_trc20', 'escrow_wallet_erc20', 'min_deposit_amo', 'min_withdraw_amo']),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', user.id).eq('status', 'completed'),
  ])

  const pendingRequests = payoutRequests?.filter(r => r.status === 'pending') ?? []
  const buyerBalance = Number(userBalance?.balance ?? 0)

  const escrowMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))
  const escrowAddresses = {
    trc20: escrowMap['escrow_wallet_trc20'] ?? '',
    erc20: escrowMap['escrow_wallet_erc20'] ?? '',
  }
  const hasDepositWallet = !!profile?.deposit_wallet
  const minDeposit = Number(escrowMap['min_deposit_amo'] ?? 10)
  const minWithdraw = Number(escrowMap['min_withdraw_amo'] ?? 200)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

      {/* === Buyer Wallet === */}
      <section>
        <h2 className="text-white text-base font-bold mb-4">My Wallet</h2>
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Balance card */}
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 flex flex-col gap-2">
            <p className="text-gray-500 text-xs uppercase tracking-wide">Spendable Balance</p>
            <p className="text-3xl font-bold text-accent">
              {buyerBalance.toFixed(2)}
              <span className="text-lg text-accent/60 ml-1.5">coin</span>
            </p>
            <p className="text-gray-500 text-xs">Deducted automatically when you buy</p>
          </div>

          {/* Deposit history */}
          <div className="lg:col-span-2 rounded-xl border border-border bg-surface">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-white text-sm font-medium">Deposit History</p>
            </div>
            {!deposits?.length ? (
              <div className="p-6 text-center">
                <p className="text-gray-600 text-sm">No deposits yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {deposits.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium">{Number(d.claimed_amount).toFixed(2)} coin</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          d.status === 'approved' ? 'bg-green-400/10 text-green-400' :
                          d.status === 'rejected' ? 'bg-red-400/10 text-red-400' :
                          'bg-yellow-400/10 text-yellow-400'
                        }`}>
                          {d.status === 'approved' ? `Approved · ${Number(d.approved_amount).toFixed(2)} coin` :
                           d.status === 'rejected' ? 'Rejected' : 'Pending review'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs font-mono truncate">{d.network} · {d.tx_hash.slice(0, 16)}…</p>
                    </div>
                    <p className="text-gray-600 text-xs shrink-0">
                      {new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deposit form */}
        <div className="mt-5 rounded-xl border border-border bg-surface p-5">
          <p className="text-white text-sm font-semibold mb-4">Top up balance</p>
          <DepositForm
            escrowAddresses={escrowAddresses}
            hasDepositWallet={hasDepositWallet}
            minDeposit={minDeposit}
          />
        </div>
      </section>

      {/* === Seller Wallet === */}
      {!!sellerBalances?.length && (
        <section>
          <h2 className="text-white text-base font-bold mb-4">Seller Earnings</h2>
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">

              {/* Withdraw requirements */}
              <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Withdraw Requirements</p>
                <div className="space-y-2">
                  {[
                    {
                      met: profile?.kyc_status === 'approved',
                      label: 'KYC Verified',
                      action: profile?.kyc_status !== 'approved' ? { href: '/profile/kyc', text: 'Verify →' } : null,
                    },
                    {
                      met: !!profile?.wallet_address,
                      label: 'Withdraw wallet set',
                      action: !profile?.wallet_address ? { href: '/profile#withdraw-wallet', text: 'Set wallet →' } : null,
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
                        <a href={action.href} className="text-accent text-xs hover:underline">{action.text}</a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5">
                <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Pending Balance</p>
                <div className="space-y-3">
                  {sellerBalances.map((b: any) => {
                    const hasPending = pendingRequests.some(r => r.currency === b.currency)
                    return (
                      <div key={b.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-2xl font-bold text-white">
                          {Number(b.pending_amount).toFixed(2)} <span className="text-sm text-gray-500">{b.currency}</span>
                        </p>
                        {!profile?.wallet_address ? (
                          <p className="text-yellow-400 text-xs">Set payout wallet first</p>
                        ) : hasPending ? (
                          <span className="px-3 py-1.5 rounded-full bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 text-xs font-medium">
                            Pending approval
                          </span>
                        ) : Number(b.pending_amount) > 0 ? (
                          <div className="flex items-center gap-2">
                            <form action={async () => {
                              'use server'
                              await requestPayout(b.currency)
                            }}>
                              <button className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-semibold hover:opacity-90">
                                Request Payout
                              </button>
                            </form>
                            <span className="text-gray-600 text-xs">Min. {minWithdraw} coin</span>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-white text-sm font-medium">Payout Wallet</p>
                  {profile?.wallet_address && <span className="text-green-400 text-xs">Connected</span>}
                </div>
                {profile?.wallet_address && (
                  <div className="rounded-lg bg-background border border-border px-3 py-2.5">
                    <p className="text-gray-500 text-xs">{profile.wallet_network}</p>
                    <p className="text-white text-sm font-mono break-all">{profile.wallet_address}</p>
                  </div>
                )}
                <WalletAddressForm currentAddress={profile?.wallet_address ?? null} currentNetwork={profile?.wallet_network ?? null} />
              </div>

            </div>

            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-surface">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-white text-sm font-medium">Earning History</p>
                </div>
                {!txLog?.length ? (
                  <div className="p-4 text-center"><p className="text-gray-600 text-xs">No transactions yet</p></div>
                ) : (
                  <div className="divide-y divide-border max-h-80 overflow-y-auto">
                    {txLog.map((tx: any) => (
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
                          {tx.order_id && <a href={`/orders/${tx.order_id}`} className="text-accent text-xs hover:underline">View</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-surface">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-white text-sm font-medium">Payouts</p>
                </div>
                {!payouts?.length ? (
                  <div className="p-4 text-center"><p className="text-gray-600 text-xs">No payouts yet</p></div>
                ) : (
                  <div className="divide-y divide-border">
                    {payouts.map((p: any) => (
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
                )}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
