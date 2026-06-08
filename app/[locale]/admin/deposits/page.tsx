import { createClient } from '@/lib/supabase/server'
import { approveDeposit, rejectDeposit } from '@/lib/actions/admin'

function explorerUrl(txHash: string, network: string) {
  if (network === 'ERC20') return `https://etherscan.io/tx/${txHash}`
  return `https://tronscan.org/#/transaction/${txHash}`
}

export default async function AdminDepositsPage() {
  const supabase = await createClient()

  const { data: deposits } = await supabase
    .from('deposit_requests')
    .select('*, profiles(username)')
    .order('created_at', { ascending: false })
    .limit(100)

  const pending  = deposits?.filter(d => d.status === 'pending') ?? []
  const reviewed = deposits?.filter(d => d.status !== 'pending') ?? []

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-white">Deposits</h1>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-white font-semibold">Pending</h2>
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-xs font-bold">{pending.length}</span>
          )}
        </div>
        {!pending.length ? (
          <div className="rounded-xl border border-border bg-surface p-6 text-center">
            <p className="text-gray-500 text-sm">No pending deposits</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((d: any) => (
              <div key={d.id} className="rounded-xl border border-yellow-700/30 bg-surface p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-semibold">{Number(d.claimed_amount).toFixed(2)} coin</p>
                      <span className="px-1.5 py-0.5 rounded bg-surface border border-border text-gray-400 text-xs">{d.network}</span>
                    </div>
                    <p className="text-gray-500 text-xs">@{d.profiles?.username ?? d.user_id.slice(0, 8)}</p>
                    <p className="text-gray-600 text-xs">
                      {new Date(d.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <a href={explorerUrl(d.tx_hash, d.network)} target="_blank" rel="noopener noreferrer"
                    className="text-accent text-xs hover:underline flex items-center gap-1">
                    View on explorer ↗
                  </a>
                </div>

                <div className="rounded-lg bg-background border border-border px-3 py-2">
                  <p className="text-gray-500 text-xs mb-0.5">TX Hash</p>
                  <p className="text-white text-xs font-mono break-all">{d.tx_hash}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <form action={async (formData: FormData) => {
                    'use server'
                    const amt = parseFloat(formData.get('approved_amount') as string)
                    if (!amt || amt <= 0) return
                    await approveDeposit(d.id, amt)
                  }} className="flex-1 flex gap-2">
                    <input name="approved_amount" type="number" step="any" min="0" defaultValue={d.claimed_amount}
                      className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:border-accent"
                      placeholder="Approve amount coin" />
                    <button type="submit"
                      className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-500 transition-colors">
                      Approve
                    </button>
                  </form>
                  <form action={async () => {
                    'use server'
                    await rejectDeposit(d.id)
                  }}>
                    <button type="submit"
                      className="px-4 py-2 rounded-xl border border-red-700/50 text-red-400 text-sm font-medium hover:bg-red-900/20 transition-colors">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {reviewed.length > 0 && (
        <section>
          <h2 className="text-white font-semibold mb-4">History</h2>
          <div className="rounded-xl border border-border bg-surface divide-y divide-border overflow-hidden">
            {reviewed.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm">{Number(d.claimed_amount).toFixed(2)} coin claimed</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      d.status === 'approved' ? 'bg-green-400/10 text-green-400' : 'bg-red-400/10 text-red-400'
                    }`}>
                      {d.status === 'approved' ? `Approved ${Number(d.approved_amount).toFixed(2)} coin` : 'Rejected'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-xs">@{d.profiles?.username} · {d.network}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-gray-600 text-xs">
                    {new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  <a href={explorerUrl(d.tx_hash, d.network)} target="_blank" rel="noopener noreferrer" className="text-accent text-xs hover:underline">TX ↗</a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
