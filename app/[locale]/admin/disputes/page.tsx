import { createClient } from '@/lib/supabase/server'
import { resolveDispute } from '@/lib/actions/admin'

export default async function AdminDisputesPage() {
  const supabase = await createClient()
  const { data: disputes } = await supabase
    .from('disputes')
    .select('*, orders(amount, currency, listings(title)), opener:profiles!opened_by(username)')
    .eq('status', 'open')
    .order('created_at', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">
        Open Disputes <span className="text-gray-500 text-lg">({disputes?.length ?? 0})</span>
      </h1>
      {!disputes?.length && <p className="text-gray-500">No open disputes.</p>}
      <div className="space-y-4">
        {disputes?.map(d => (
          <div key={d.id} className="rounded border border-border bg-surface p-5 space-y-3">
            <div>
              <p className="text-white font-medium">{(d as any).orders?.listings?.title}</p>
              <p className="text-accent text-sm">
                {(d as any).orders?.amount} {(d as any).orders?.currency}
              </p>
              <p className="text-gray-400 text-sm">
                Opened by: {(d as any).opener?.username ?? d.opened_by}
              </p>
              <p className="text-gray-400 text-sm">Reason: {d.reason}</p>
              <p className="text-gray-500 text-xs">{new Date(d.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-3">
              <form action={async () => {
                'use server'
                await resolveDispute(d.id, 'release_to_seller')
              }}>
                <button className="px-4 py-2 rounded bg-green-700 text-white text-sm font-medium hover:bg-green-600">
                  Release to Seller
                </button>
              </form>
              <form action={async () => {
                'use server'
                await resolveDispute(d.id, 'refund_to_buyer')
              }}>
                <button className="px-4 py-2 rounded bg-red-700 text-white text-sm font-medium hover:bg-red-600">
                  Refund to Buyer
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
