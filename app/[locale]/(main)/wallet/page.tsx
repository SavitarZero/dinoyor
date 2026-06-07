import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WalletAddressForm } from '@/components/wallet/WalletAddressForm'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: balances },
    { data: payouts },
  ] = await Promise.all([
    supabase.from('profiles').select('wallet_address, wallet_network').eq('id', user.id).single(),
    supabase.from('seller_balances').select('*').eq('seller_id', user.id),
    supabase.from('payouts').select('*').eq('seller_id', user.id).order('processed_at', { ascending: false }),
  ])

  const totalUsdt = balances?.reduce((sum, b) => b.currency === 'USDT' ? sum + Number(b.pending_amount) : sum, 0) ?? 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Wallet</h1>

      {/* Balance card */}
      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div>
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Pending Balance</p>
          {!balances?.length ? (
            <p className="text-3xl font-bold text-white">0 <span className="text-lg text-gray-500">USDT</span></p>
          ) : (
            <div className="space-y-1">
              {balances.map(b => (
                <p key={b.id} className="text-3xl font-bold text-white">
                  {Number(b.pending_amount).toFixed(2)} <span className="text-lg text-gray-500">{b.currency}</span>
                </p>
              ))}
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

      {/* Wallet address */}
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

      {/* Payout history */}
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
