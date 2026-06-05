import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { OrderStatus } from '@/lib/types'

const statusColor: Record<OrderStatus, string> = {
  awaiting_payment: 'text-yellow-400',
  paid_escrow: 'text-blue-400',
  delivered: 'text-purple-400',
  completed: 'text-green-400',
  disputed: 'text-red-400',
  cancelled: 'text-gray-500',
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, amount, currency, status, created_at, listings(title)')
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-6">My Orders</h1>
      {!orders?.length && (
        <p className="text-gray-500 text-center py-16">No orders yet.</p>
      )}
      <div className="space-y-3">
        {orders?.map(o => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            className="flex items-center justify-between p-4 rounded-xl border border-border bg-surface hover:border-accent transition-colors"
          >
            <div>
              <p className="text-white font-medium">{(o as any).listings?.title}</p>
              <p className="text-gray-500 text-xs mt-1">{new Date(o.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="text-accent font-semibold">{o.amount} {o.currency}</p>
              <p className={`text-xs mt-1 capitalize ${statusColor[o.status as OrderStatus]}`}>
                {o.status.replace(/_/g, ' ')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
