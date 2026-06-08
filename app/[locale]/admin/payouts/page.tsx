import { createClient } from '@/lib/supabase/server'
import { approvePayoutRequest, rejectPayoutRequest } from '@/lib/actions/payouts'

export default async function AdminPayoutsPage() {
  const supabase = await createClient()
  const { data: requests } = await supabase
    .from('payout_requests')
    .select('*, profiles!seller_id(username, wallet_address, wallet_network)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">
        Payout Requests <span className="text-gray-500 text-lg">({requests?.length ?? 0})</span>
      </h1>
      {!requests?.length && <p className="text-gray-500">No pending payout requests.</p>}
      <div className="space-y-4">
        {requests?.map(r => (
          <div key={r.id} className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-white font-medium">{(r as any).profiles?.username ?? r.seller_id}</p>
                <p className="text-accent text-xl font-bold">{Number(r.amount).toFixed(2)} {r.currency}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-xs">
                  {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })}
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-background border border-border px-4 py-2.5">
              <p className="text-gray-500 text-xs">{(r as any).profiles?.wallet_network}</p>
              <p className="text-white text-sm font-mono break-all">{r.wallet_address}</p>
            </div>
            <form
              action={async (fd: FormData) => {
                'use server'
                const action = fd.get('action') as string
                if (action === 'approve') {
                  await approvePayoutRequest(r.id, fd.get('tx_hash') as string)
                } else {
                  await rejectPayoutRequest(r.id, fd.get('reason') as string || 'Rejected by admin')
                }
              }}
              className="space-y-2"
            >
              <input
                name="tx_hash"
                placeholder="Transaction hash (after sending)"
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-white text-sm"
              />
              <input
                name="reason"
                placeholder="Rejection reason (optional)"
                className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-white text-sm"
              />
              <div className="flex gap-2">
                <button name="action" value="approve" className="px-4 py-2.5 rounded-lg bg-accent text-black text-sm font-semibold hover:opacity-90">
                  Approve
                </button>
                <button name="action" value="reject" className="px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-semibold hover:opacity-90">
                  Reject
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
