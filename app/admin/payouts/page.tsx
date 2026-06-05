import { createClient } from '@/lib/supabase/server'
import { processPayout } from '@/lib/actions/admin'

export default async function AdminPayoutsPage() {
  const supabase = await createClient()
  const { data: balances } = await supabase
    .from('seller_balances')
    .select('*, profiles!seller_id(username)')
    .gt('pending_amount', 0)
    .order('pending_amount', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">
        Pending Payouts <span className="text-gray-500 text-lg">({balances?.length ?? 0})</span>
      </h1>
      {!balances?.length && <p className="text-gray-500">No pending payouts.</p>}
      <div className="space-y-4">
        {balances?.map(b => (
          <div key={b.id} className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div>
              <p className="text-white font-medium">
                {(b as any).profiles?.username ?? b.seller_id}
              </p>
              <p className="text-accent text-xl font-bold">{b.pending_amount} {b.currency}</p>
            </div>
            <form
              action={async (fd: FormData) => {
                'use server'
                await processPayout(
                  b.seller_id,
                  b.currency,
                  fd.get('wallet_address') as string,
                  fd.get('tx_hash') as string
                )
              }}
              className="space-y-2"
            >
              <input
                name="wallet_address"
                placeholder="Destination wallet address"
                required
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm"
              />
              <input
                name="tx_hash"
                placeholder="Transaction hash (after sending)"
                required
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm"
              />
              <button className="px-4 py-2 rounded-lg bg-accent text-black text-sm font-semibold hover:opacity-90">
                Mark as Paid
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
