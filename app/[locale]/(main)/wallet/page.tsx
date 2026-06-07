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
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Wallet</h1>

      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Pending Balance</p>
          {!balances?.length ? (
            <p className="text-3xl font-bold text-white">0 <span className="text-lg text-gray-500">USDT</span></p>
          ) : (
            <div className="space-y-4">
              {balances.map(b => {
                const hasPending = pendingRequests.some(r => r.currency === b.currency)
                return (
                  <div key={b.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <p className="text-3xl font-bold text-white">
                      {Number(b.pending_amount).toFixed(2)} <span className="text-lg text-gray-500">{b.currency}</span>
                    </p>
                    {!profile?.wallet_address ? (
                      <p className="text-yellow-400 text-xs">Set payout wallet first</p>
                    ) : hasPending ? (
                      <span className="px-3 py-1.5 rounded-full bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 text-xs font-medium">
                        Payout requested — pending admin approval
                      </span>
                    ) : Number(b.pending_amount) > 0 ? (
                      <div className="flex items-center gap-2">
                        <form action={async () => {
                          'use server'
                          await requestPayout(b.currency)
                        }}>
                          <button className="px-4 py-2.5 rounded-lg bg-accent text-black text-sm font-semibold hover:opacity-90">
                            Request Payout
                          </button>
                        </form>
                        <span className="text-gray-500 text-xs">Min. {minAmount} USDT</span>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-gray-500 text-xs">
            Payouts are processed on the <span className="text-white">1st of each month</span>.
            Make sure your wallet address below is correct before the payout date.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">Payout Wallet</p>
            <p className="text-gray-500 text-xs mt-0.5">Where your earnings will be sent</p>
          </div>
          {profile?.wallet_address && (
            <span className="px-2 py-1 rounded-full bg-green-900/30 border border-green-700/40 text-green-400 text-xs font-medium">
              Set
            </span>
          )}
        </div>

        {profile?.wallet_address && (
          <div className="rounded-xl bg-background border border-border px-4 py-3 space-y-1">
            <p className="text-gray-500 text-xs">{profile.wallet_network}</p>
            <p className="text-white text-sm font-mono break-all">{profile.wallet_address}</p>
          </div>
        )}

        <WalletAddressForm
          currentAddress={profile?.wallet_address ?? null}
          currentNetwork={profile?.wallet_network ?? null}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 space-y-3">
        <div>
          <p className="text-white font-semibold">Payout Settings</p>
          <p className="text-gray-500 text-xs mt-0.5">Set your minimum payout threshold</p>
        </div>
        <PayoutSettingsForm currentMin={minAmount} />
      </div>

      <div>
        <h2 className="text-white font-semibold mb-3">Transaction History</h2>
        {!txLog?.length ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-center">
            <p className="text-gray-500 text-sm">No transactions yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface divide-y divide-border">
            {txLog.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <span className={`text-lg font-bold ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                    {tx.type === 'credit' ? '+' : '-'}
                  </span>
                  <div>
                    <p className="text-white font-semibold">
                      {Number(tx.amount).toFixed(2)} {tx.currency}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">{tx.note}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">
                    {new Date(tx.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                  </p>
                  {tx.order_id && (
                    <a href={`/orders/${tx.order_id}`} className="text-accent text-xs hover:underline">
                      View order
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-white font-semibold mb-3">Payout History</h2>
        {!payouts?.length ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-center">
            <p className="text-gray-500 text-sm">No payouts yet.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-surface divide-y divide-border">
            {payouts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-white font-semibold">{Number(p.amount).toFixed(2)} {p.currency}</p>
                  <p className="text-gray-500 text-xs mt-0.5 font-mono truncate max-w-48">{p.wallet_address}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs">
                    {new Date(p.processed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                  </p>
                  {p.tx_hash && (
                    <p className="text-gray-600 text-xs font-mono truncate max-w-24 mt-0.5">{p.tx_hash.slice(0, 12)}…</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
