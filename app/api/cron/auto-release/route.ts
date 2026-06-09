import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

type Results = { cancelled: number; autoCompleted: number; holdReleased: number; errors: string[] }

async function cancelOverdueOrders(supabase: SupabaseClient, now: string, results: Results) {
  const { data: orders } = await supabase
    .from('orders')
    .select('id, buyer_id, amount, listing_id')
    .eq('status', 'paid_escrow')
    .not('delivery_deadline_at', 'is', null)
    .lt('delivery_deadline_at', now)

  for (const order of orders ?? []) {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id)
      .eq('status', 'paid_escrow')

    if (error) { results.errors.push(`cancel ${order.id}: ${error.message}`); continue }

    const { error: refundErr } = await supabase.rpc('increment_user_balance', {
      p_user_id: order.buyer_id, p_currency: 'USDT', p_amount: order.amount,
    })
    if (refundErr) results.errors.push(`refund ${order.id}: ${refundErr.message}`)

    await supabase.from('listings').update({ status: 'active' }).eq('id', order.listing_id)
    results.cancelled++
  }
}

async function autoCompleteOrders(
  supabase: SupabaseClient,
  now: string,
  flatFee: number,
  holdDays: number,
  results: Results,
) {
  const { data: orders } = await supabase
    .from('orders')
    .select('id, seller_id, amount, platform_fee_pct')
    .eq('status', 'delivered')
    .not('auto_release_at', 'is', null)
    .lt('auto_release_at', now)

  for (const order of orders ?? []) {
    const { error } = await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', order.id)
      .eq('status', 'delivered')

    if (error) { results.errors.push(`complete ${order.id}: ${error.message}`); continue }

    const fee = (order.amount * order.platform_fee_pct) / 100
    const sellerAmount = Math.max(0, order.amount - fee - flatFee)
    const availableAt = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000).toISOString()

    await supabase.rpc('increment_seller_balance', {
      p_seller_id: order.seller_id, p_currency: 'USDT', p_amount: sellerAmount,
    })
    await supabase.from('balance_transactions').insert({
      seller_id: order.seller_id,
      order_id: order.id,
      type: 'credit',
      amount: sellerAmount,
      currency: 'USDT',
      note: `Order #${order.id.slice(0, 8).toUpperCase()} auto-completed`,
      available_at: availableAt,
      hold_released: false,
    })
    results.autoCompleted++
  }
}

async function releaseMaturedHolds(supabase: SupabaseClient, now: string, results: Results) {
  const { data: credits } = await supabase
    .from('balance_transactions')
    .select('id, seller_id, amount, currency')
    .eq('type', 'credit')
    .eq('hold_released', false)
    .not('available_at', 'is', null)
    .lt('available_at', now)

  for (const credit of credits ?? []) {
    const { error } = await supabase
      .from('balance_transactions')
      .update({ hold_released: true })
      .eq('id', credit.id)
      .eq('hold_released', false)

    if (error) { results.errors.push(`release_tx ${credit.id}: ${error.message}`); continue }

    const { error: releaseErr } = await supabase.rpc('release_seller_balance', {
      p_seller_id: credit.seller_id, p_currency: credit.currency, p_amount: credit.amount,
    })
    if (releaseErr) {
      results.errors.push(`release_balance ${credit.id}: ${releaseErr.message}`)
      await supabase.from('balance_transactions').update({ hold_released: false }).eq('id', credit.id)
    } else {
      results.holdReleased++
    }
  }
}

// Called by an external scheduler (Vercel Cron, Supabase pg_cron, etc.)
// Set CRON_SECRET env var to protect this endpoint
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const results: Results = { cancelled: 0, autoCompleted: 0, holdReleased: 0, errors: [] }

  const { data: settingsRows } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['platform_flat_fee', 'payout_hold_days'])

  const s: Record<string, string> = {}
  for (const row of settingsRows ?? []) s[row.key] = row.value
  const flatFee = Number(s['platform_flat_fee'] ?? 1)
  const holdDays = Number(s['payout_hold_days'] ?? 7)

  await cancelOverdueOrders(supabase, now, results)
  await autoCompleteOrders(supabase, now, flatFee, holdDays, results)
  await releaseMaturedHolds(supabase, now, results)

  return NextResponse.json(results)
}

export async function GET(request: NextRequest) {
  return POST(request)
}
