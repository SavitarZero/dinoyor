'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Order {
  id: string
  status: string
  amount: number
  created_at: string
  listings: { title: string } | null
}

interface Props {
  buyerOrders: Order[]
  sellerOrders: Order[]
}

const statusColor: Record<string, string> = {
  awaiting_payment: 'text-gray-400',
  paid_escrow: 'text-yellow-400',
  delivered: 'text-blue-400',
  completed: 'text-green-400',
  disputed: 'text-red-400',
  cancelled: 'text-gray-500',
}

export function ProfileOrderTabs({ buyerOrders, sellerOrders }: Props) {
  const [tab, setTab] = useState<'buying' | 'selling'>('buying')
  const orders = tab === 'buying' ? buyerOrders : sellerOrders

  return (
    <div>
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setTab('buying')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'buying' ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'}`}
        >
          Buying
        </button>
        <button
          onClick={() => setTab('selling')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'selling' ? 'bg-accent text-black' : 'text-gray-400 hover:text-white'}`}
        >
          Selling
        </button>
      </div>
      {!orders.length ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <p className="text-gray-500 text-sm">No orders yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-surface divide-y divide-border">
          {orders.map(o => (
            <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
              <div>
                <p className="text-white text-sm font-medium">{o.listings?.title ?? 'Untitled'}</p>
                <p className={`text-xs capitalize ${statusColor[o.status] ?? 'text-gray-400'}`}>{o.status.replace(/_/g, ' ')}</p>
              </div>
              <div className="text-right">
                <p className="text-white text-sm font-semibold">{Number(o.amount).toFixed(2)} USDT</p>
                <p className="text-gray-500 text-xs">
                  {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
