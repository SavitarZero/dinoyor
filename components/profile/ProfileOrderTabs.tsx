'use client'
import { useState } from 'react'
import Link from 'next/link'

interface Order {
  id: string
  status: string
  amount: number
  created_at: string
  listings: { title: string; images?: string[] } | null
}

interface Props {
  buyerOrders: Order[]
  sellerOrders: Order[]
}

export function ProfileOrderTabs({ buyerOrders, sellerOrders }: Props) {
  const [tab, setTab] = useState<'buying' | 'selling'>('selling')
  const orders = tab === 'buying' ? buyerOrders : sellerOrders

  return (
    <div>
      <div className="flex border-b border-border mb-0">
        <button
          onClick={() => setTab('buying')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'buying' ? 'border-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Purchases
        </button>
        <button
          onClick={() => setTab('selling')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'selling' ? 'border-accent text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Sales
        </button>
      </div>
      {!orders.length ? (
        <div className="rounded-b-xl border border-t-0 border-border bg-surface p-8 text-center">
          <p className="text-gray-500 text-sm">
            {tab === 'buying' ? 'No purchases yet.' : 'No sales yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-b-xl border border-t-0 border-border bg-surface divide-y divide-border overflow-hidden">
          {orders.map(o => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
            >
              <div className="w-10 h-10 rounded overflow-hidden bg-background shrink-0">
                {o.listings?.images?.[0] ? (
                  <img src={o.listings.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-background" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{o.listings?.title ?? 'Untitled'}</p>
                <p className="text-gray-600 text-xs">
                  {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-white text-sm font-medium">${Number(o.amount).toFixed(2)}</p>
                <p className={`text-xs capitalize ${
                  o.status === 'completed' ? 'text-green-400' :
                  o.status === 'cancelled' ? 'text-gray-500' :
                  o.status === 'disputed' ? 'text-red-400' : 'text-gray-400'
                }`}>{o.status.replace(/_/g, ' ')}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
