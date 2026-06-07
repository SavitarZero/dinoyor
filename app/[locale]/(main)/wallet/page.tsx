import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WalletAddressForm } from '@/components/wallet/WalletAddressForm'
import { PayoutSettingsForm } from '@/components/wallet/PayoutSettingsForm'
import { requestPayout } from '@/lib/actions/payouts'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: balances },
    { data: payouts },
    { data: txLog },
    { data: payoutRequests },
  ] = await Promise.all([
    supabase.from('profiles').select('wallet_address, wallet_network, payout_min_amount').eq('id', user.id).single(),
    supabase.from('seller_balances').select('*').eq('seller_id', user.id),
    supabase.from('payouts').select('*').eq('seller_id', user.id).order('processed_at', { ascending: false }),
    supabase.from('balance_transactions').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }).limit(50),
    supabase.from('payout_requests').select('*').eq('seller_id', user.id).order('created_at', { ascending: false }),
  ])

  const pendingRequests = payoutRequests?.filter(r => r.status === 'pending') ?? []
  const minAmount = Number(profile?.payout_min_amount ?? 10)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-lg font-bold text-white mb-6">Wallet</h1>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-gray-500 text-xs uppercase tracking-wide mb-3">Pending Balance</p>
            {!balances?.length ? (
              <p className="text-2xl font-bold text-white">$0.00 <span className="text-sm text-gray-500">USDT</span></p>
            ) : (
              <div className="space-y-3">
                {balances.map(b => {
                  const hasPending = pendingRequests.some(r => r.currency === b.currency)
                  return (
                    <div key={b.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <p className="text-2xl font-bold text-white">
                        ${Number(b.pending_amount).toFixed(2)} <span className="text-sm text-gray-500">{b.currency}</span>
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
                          <span className="text-gray-600 text-xs">Min. {minAmount}</span>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-white text-sm font-medium">Payout Wallet</p>
              {profile?.wallet_address && (
                <span className="text-green-400 text-xs">Connected</span>
              )}
            </div>
            {profile?.wallet_address && (
              <div className="rounded-lg bg-background border border-border px-3 py-2.5">
                <p className="text-gray-500 text-xs">{profile.wallet_network}</p>
                <p className="text-white text-sm font-mono break-all">{profile.wallet_address}</p>
              </div>
            )}
            <WalletAddressForm
              currentAddress={profile?.wallet_address ?? null}
              currentNetwork={profile?.wallet_network ?? null}
            />
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <p className="text-white text-sm font-medium">Payout Settings</p>
            <PayoutSettingsForm currentMin={minAmount} />
          </div>

        </div>

        <div className="lg:col-span-1 space-y-5">

          <div className="rounded-xl border border-border bg-surface">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-white text-sm font-medium">Transactions</p>
            </div>
            {!txLog?.length ? (
              <div className="p-4 text-center">
                <p className="text-gray-600 text-xs">No transactions yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {txLog.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-sm font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.type === 'credit' ? '+' : '-'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-white text-sm">${Number(tx.amount).toFixed(2)}</p>
                        <p className="text-gray-600 text-xs truncate">{tx.note}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-gray-600 text-xs">
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                      {tx.order_id && (
                        <a href={`/orders/${tx.order_id}`} className="text-accent text-xs hover:underline">View</a>
                      )}
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
              <div className="p-4 text-center">
                <p className="text-gray-600 text-xs">No payouts yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {payouts.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium">${Number(p.amount).toFixed(2)}</p>
                      <p className="text-gray-600 text-xs font-mono truncate">{p.wallet_address?.slice(0, 10)}…</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-gray-600 text-xs">
                        {new Date(p.processed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
