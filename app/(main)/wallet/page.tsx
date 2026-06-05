import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: balances } = await supabase
    .from('seller_balances')
    .select('*')
    .eq('seller_id', user.id)

  const { data: payouts } = await supabase
    .from('payouts')
    .select('*')
    .eq('seller_id', user.id)
    .order('processed_at', { ascending: false })

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold text-white">Wallet</h1>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Pending Balance</h2>
        {!balances?.length ? (
          <p className="text-gray-500 text-sm">No balance yet. Complete a sale to earn.</p>
        ) : (
          <div className="space-y-3">
            {balances.map(b => (
              <div key={b.id} className="rounded-xl border border-border bg-surface p-5">
                <p className="text-3xl font-bold text-accent">{b.pending_amount} {b.currency}</p>
                <p className="text-gray-500 text-sm mt-2">
                  Paid out on the 1st of each month. Contact support with your wallet address to receive payment.
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-3">Payout History</h2>
        {!payouts?.length ? (
          <p className="text-gray-500 text-sm">No payouts yet.</p>
        ) : (
          <div className="rounded-xl border border-border bg-surface divide-y divide-border">
            {payouts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="text-white font-medium">{p.amount} {p.currency}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {new Date(p.processed_at).toLocaleDateString()}
                  </p>
                </div>
                {p.tx_hash && (
                  <p className="text-gray-600 text-xs font-mono truncate max-w-[140px]">
                    {p.tx_hash}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
