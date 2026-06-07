import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrderTabs } from '@/components/orders/OrderTabs'
import type { OrderStatus } from '@/lib/types/index'

const STATUS_LABEL: Record<OrderStatus, string> = {
  awaiting_payment: 'Awaiting Payment',
  paid_escrow:      'In Escrow',
  delivered:        'Delivered',
  completed:        'Completed',
  disputed:         'Disputed',
  cancelled:        'Cancelled',
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  awaiting_payment: 'bg-yellow-900/30 text-yellow-400 border-yellow-700/40',
  paid_escrow:      'bg-blue-900/30 text-blue-400 border-blue-700/40',
  delivered:        'bg-purple-900/30 text-purple-400 border-purple-700/40',
  completed:        'bg-green-900/30 text-green-400 border-green-700/40',
  disputed:         'bg-red-900/30 text-red-400 border-red-700/40',
  cancelled:        'bg-surface text-gray-500 border-border',
}

const ACTIVE_STATUSES = ['awaiting_payment', 'paid_escrow', 'delivered']

interface Props { searchParams: Promise<{ tab?: string }> }

export default async function OrdersPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { tab = 'all' } = await searchParams

  let q = supabase
    .from('orders')
    .select('id, amount, status, created_at, buyer_id, seller_id, listings(title, images)')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (tab === 'active')    q = q.in('status', ACTIVE_STATUSES)
  if (tab === 'completed') q = q.eq('status', 'completed')
  if (tab === 'disputed')  q = q.eq('status', 'disputed')

  const { data: orders } = await q

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-bold text-white">My Orders</h1>
        <span className="text-gray-600 text-sm">{orders?.length ?? 0} orders</span>
      </div>

      <OrderTabs active={tab} />

      {!orders?.length ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-sm">No orders found</p>
          <Link href="/market" className="inline-block text-accent text-sm hover:underline mt-2">
            Browse market →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map(o => {
            const status = o.status as OrderStatus
            const image = (o as any).listings?.images?.[0]
            const isbuyer = o.buyer_id === user.id
            const role = isbuyer ? 'Buying' : 'Selling'
            const needsAction =
              (isbuyer && status === 'awaiting_payment') ||
              (isbuyer && status === 'delivered') ||
              (!isbuyer && status === 'paid_escrow')

            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-border bg-surface hover:border-accent transition-all group"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-background shrink-0">
                  {image ? (
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-700">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-white text-sm font-medium truncate group-hover:text-accent transition-colors">
                    {(o as any).listings?.title ?? 'Unknown item'}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-background border border-border text-gray-500">
                      {role}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[status]}`}>
                      {STATUS_LABEL[status]}
                    </span>
                    {needsAction && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-medium animate-pulse">
                        Action
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-white text-sm font-bold">${o.amount}</p>
                  <p className="text-gray-600 text-xs">
                    {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
