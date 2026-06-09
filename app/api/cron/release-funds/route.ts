import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()

  // 1. Release held balances that have passed available_at
  const { data: pendingTx } = await admin
    .from('balance_transactions')
    .select('id, seller_id, amount, currency')
    .eq('hold_released', false)
    .eq('type', 'credit')
    .not('available_at', 'is', null)
    .lte('available_at', now)

  let released = 0
  for (const tx of pendingTx ?? []) {
    await admin.rpc('release_seller_balance', {
      p_seller_id: tx.seller_id,
      p_currency: tx.currency,
      p_amount: tx.amount,
    })
    await admin.from('balance_transactions').update({ hold_released: true }).eq('id', tx.id)
    released++
  }

  // 2. Auto-cancel expired orders (paid_escrow past delivery_deadline_at)
  const { data: expiredOrders } = await admin
    .from('orders')
    .select('id, buyer_id, amount, listing_id')
    .eq('status', 'paid_escrow')
    .not('delivery_deadline_at', 'is', null)
    .lte('delivery_deadline_at', now)

  let cancelled = 0
  for (const order of expiredOrders ?? []) {
    await admin.rpc('increment_user_balance', {
      p_user_id: order.buyer_id,
      p_currency: 'USDT',
      p_amount: order.amount,
    })
    await admin.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    await admin.from('listings').update({ status: 'active' }).eq('id', order.listing_id)
    cancelled++
  }

  return NextResponse.json({ released, cancelled })
}
