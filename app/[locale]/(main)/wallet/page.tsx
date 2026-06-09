import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DepositForm } from '@/components/wallet/DepositForm'
import type { DepositRequest } from '@/lib/types'

export default async function WalletPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: userBalance },
    { data: deposits },
    { data: settings },
  ] = await Promise.all([
    supabase.from('profiles').select('deposit_wallet_trc20, deposit_wallet_erc20').eq('id', user.id).single(),
    supabase.from('user_balances').select('balance').eq('user_id', user.id).eq('currency', 'USDT').maybeSingle(),
    supabase.from('deposit_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    supabase.from('platform_settings').select('key, value').in('key', ['escrow_wallet_trc20', 'escrow_wallet_erc20', 'escrow_wallet_trc20_testnet', 'escrow_wallet_erc20_testnet', 'min_deposit_amo']),
  ])

  const buyerBalance = Number(userBalance?.balance ?? 0)
  const escrowMap = Object.fromEntries((settings ?? []).map(s => [s.key, s.value]))
  const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET === 'true'
  const escrowAddresses = {
    trc20: (isTestnet ? escrowMap['escrow_wallet_trc20_testnet'] : escrowMap['escrow_wallet_trc20']) ?? '',
    erc20: (isTestnet ? escrowMap['escrow_wallet_erc20_testnet'] : escrowMap['escrow_wallet_erc20']) ?? '',
  }
  const senderWallets = {
    trc20: profile?.deposit_wallet_trc20 ?? null,
    erc20: profile?.deposit_wallet_erc20 ?? null,
  }
  const minDeposit = Number(escrowMap['min_deposit_amo'] ?? 10)
  const typedDeposits = (deposits ?? []) as unknown as DepositRequest[]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-white text-xl font-bold mb-6">Ammonite Coin Wallet</h1>
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Balance card */}
        <div className="rounded-xl border border-green-700/30 bg-green-900/10 p-5 flex flex-col gap-2">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Balance</p>
          <p className="text-3xl font-bold text-green-400">
            {buyerBalance.toFixed(2)}
            <span className="text-lg text-green-600 ml-1.5">coin</span>
          </p>
          <p className="text-gray-500 text-xs">Used for purchases — topped up via deposit</p>
        </div>

        {/* Deposit history */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-white text-sm font-medium">Deposit History</p>
          </div>
          {typedDeposits.length ? (
            <div className="divide-y divide-border">
              {typedDeposits.map((d) => {
                let statusClass = 'bg-yellow-400/10 text-yellow-400'
                let statusLabel = 'Pending review'
                if (d.status === 'approved') {
                  statusClass = 'bg-green-400/10 text-green-400'
                  statusLabel = `Approved · ${Number(d.approved_amount).toFixed(2)} coin`
                } else if (d.status === 'rejected') {
                  statusClass = 'bg-red-400/10 text-red-400'
                  statusLabel = 'Rejected'
                }
                return (
                  <div key={d.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-white text-sm font-medium">{Number(d.claimed_amount).toFixed(2)} coin</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs font-mono truncate">{d.network} · {d.tx_hash.slice(0, 16)}…</p>
                    </div>
                    <p className="text-gray-600 text-xs shrink-0">
                      {new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-600 text-sm">No deposits yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Top up */}
      <div className="mt-5 rounded border border-border bg-surface">
        <div className="px-5 py-3 border-b border-border">
          <p className="text-white text-sm font-semibold">Top up balance</p>
        </div>
        <div className="px-5 py-4">
          <DepositForm
            escrowAddresses={escrowAddresses}
            senderWallets={senderWallets}
            minDeposit={minDeposit}
          />
        </div>
      </div>
    </div>
  )
}
