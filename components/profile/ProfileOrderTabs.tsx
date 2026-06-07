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

const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: 'Awaiting Payment',
  paid_escrow: 'In Escrow',
  delivered: 'Delivered',
  completed: 'Completed',
  disputed: 'Disputed',
  cancelled: 'Cancelled',
}

const STATUS_STYLE: Record<string, string> = {
  awaiting_payment: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/40',
  paid_escrow: 'bg-blue-900/30 text-blue-400 border-blue-700/40',
  delivered: 'bg-purple-900/30 text-purple-400 border-purple-700/40',
  completed: 'bg-green-900/30 text-green-400 border-green-700/40',
  disputed: 'bg-red-900/30 text-red-400 border-red-700/40',
  cancelled: 'bg-surface text-gray-500 border-border',
}

export function ProfileOrderTabs({ buyerOrders, sellerOrders }: Props) {
  const [tab, setTab] = useState<'buying' | 'selling'>('buying')
  const orders = tab === 'buying' ? buyerOrders : sellerOrders

  return (
    <div>
      <div className="flex gap-1 p-1 rounded-xl bg-background border border-border w-fit mb-4">
        <button
          onClick={() => setTab('buying')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'buying' ? 'bg-accent text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
        >
          Buying ({buyerOrders.length})
        </button>
        <button
          onClick={() => setTab('selling')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'selling' ? 'bg-accent text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
        >
          Selling ({sellerOrders.length})
        </button>
      </div>
      {!orders.length ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No {tab === 'buying' ? 'purchases' : 'sales'} yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map(o => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-border bg-surface hover:border-accent transition-all group"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-background shrink-0">
                {o.listings?.images?.[0] ? (
                  <img src={o.listings.images[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate group-hover:text-accent transition-colors">
                  {o.listings?.title ?? 'Untitled'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[o.status] ?? 'bg-surface text-gray-500 border-border'}`}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                  <span className="text-gray-600 text-xs">
                    {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0 flex items-center gap-2">
                <div>
                  <p className="text-white font-bold text-sm">{Number(o.amount).toFixed(2)}</p>
                  <p className="text-gray-500 text-xs">USDT</p>
                </div>
                <svg className="w-4 h-4 text-gray-600 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
