import { createClient } from '@/lib/supabase/server'
import { confirmPaymentReceived } from '@/lib/actions/orders'
import Link from 'next/link'

const IS_TESTNET = process.env.NEXT_PUBLIC_IS_TESTNET === 'true'

function explorerUrl(txHash: string, network: string) {
  if (network === 'ERC20')
    return IS_TESTNET ? `https://sepolia.etherscan.io/tx/${txHash}` : `https://etherscan.io/tx/${txHash}`
  return IS_TESTNET
    ? `https://nile.tronscan.org/#/transaction/${txHash}`
    : `https://tronscan.org/#/transaction/${txHash}`
}

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, amount, payment_notified_at, payment_tx_hash, payment_network, created_at, listings(title), buyer:profiles!buyer_id(username), seller:profiles!seller_id(username)')
    .eq('status', 'awaiting_payment')
    .order('payment_notified_at', { ascending: true, nullsFirst: false })

  const notified  = orders?.filter(o => o.payment_notified_at) ?? []
  const waiting   = orders?.filter(o => !o.payment_notified_at) ?? []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">
          Awaiting Payment <span className="text-gray-500 text-lg">({orders?.length ?? 0})</span>
        </h1>
      </div>

      {/* Buyer notified — action needed */}
      {notified.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <h2 className="text-yellow-400 font-semibold text-sm">Buyer notified payment sent ({notified.length})</h2>
          </div>
          <div className="space-y-3">
            {notified.map(o => (
              <OrderRow key={o.id} order={o} highlight />
            ))}
          </div>
        </div>
      )}

      {/* Still waiting */}
      {waiting.length > 0 && (
        <div>
          <h2 className="text-gray-500 font-medium text-sm mb-3">Waiting for buyer ({waiting.length})</h2>
          <div className="space-y-3">
            {waiting.map(o => (
              <OrderRow key={o.id} order={o} highlight={false} />
            ))}
          </div>
        </div>
      )}

      {!orders?.length && (
        <p className="text-gray-500">No orders awaiting payment.</p>
      )}
    </div>
  )
}

function OrderRow({ order, highlight }: { order: any; highlight: boolean }) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-4 ${
      highlight ? 'border-yellow-700/50 bg-yellow-900/10' : 'border-border bg-surface'
    }`}>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-white font-medium text-sm truncate">{order.listings?.title ?? 'Unknown item'}</p>
        <p className="text-gray-500 text-xs">
          Buyer: <span className="text-gray-300">{order.buyer?.username}</span>
          {' · '}
          Seller: <span className="text-gray-300">{order.seller?.username}</span>
        </p>
        {order.payment_notified_at && (
          <p className="text-yellow-400 text-xs">
            Notified: {new Date(order.payment_notified_at).toLocaleString('en-GB', {
              day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
            })}
          </p>
        )}
        {order.payment_tx_hash && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-500 text-xs font-mono truncate max-w-40">{order.payment_tx_hash}</span>
            <a
              href={explorerUrl(order.payment_tx_hash, order.payment_network ?? 'ERC20')}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-accent text-xs hover:underline flex items-center gap-1"
            >
              Verify ↗
            </a>
          </div>
        )}
        <p className="text-gray-600 text-xs">
          Created: {new Date(order.created_at).toLocaleString('en-GB', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC'
          })}
        </p>
      </div>

      <div className="shrink-0 text-right space-y-2">
        <p className="text-accent font-bold">{order.amount} USDT</p>
        <div className="flex gap-2">
          <Link
            href={`/orders/${order.id}`}
            className="px-3 py-1.5 rounded-lg border border-border text-gray-400 text-xs hover:text-white hover:border-accent transition-colors"
          >
            View
          </Link>
          <form action={async () => {
            'use server'
            await confirmPaymentReceived(order.id)
          }}>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-accent text-black text-xs font-bold hover:opacity-90 transition-opacity"
            >
              Confirm Payment
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
