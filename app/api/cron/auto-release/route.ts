import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: expiredOrders, error } = await supabase
    .from('orders')
    .select('id, seller_id, amount, currency, platform_fee_pct')
    .eq('status', 'delivered')
    .lt('auto_release_at', new Date().toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let released = 0
  for (const order of expiredOrders ?? []) {
    const fee = (order.amount * order.platform_fee_pct) / 100
    const sellerAmount = order.amount - fee

    await supabase.rpc('increment_seller_balance', {
      p_seller_id: order.seller_id,
      p_currency: order.currency,
      p_amount: sellerAmount,
    })
    await supabase.from('orders').update({ status: 'completed' }).eq('id', order.id)
    released++
  }

  return NextResponse.json({ released, processed_at: new Date().toISOString() })
}
