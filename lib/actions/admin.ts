'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorized')
  return { supabase, userId: user.id }
}

export async function reviewKYC(
  submissionId: string,
  decision: 'approved' | 'rejected',
  reason?: string
) {
  const { supabase, userId } = await requireAdmin()

  const { data: sub } = await supabase
    .from('kyc_submissions')
    .select('user_id')
    .eq('id', submissionId)
    .single()
  if (!sub) return { error: 'Submission not found' }

  await supabase.from('kyc_submissions').update({
    status: decision,
    rejection_reason: reason ?? null,
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
  }).eq('id', submissionId)

  await supabase.from('profiles').update({ kyc_status: decision }).eq('id', sub.user_id)

  revalidatePath('/admin/kyc')
  return { success: true }
}

export async function resolveDispute(
  disputeId: string,
  resolution: 'release_to_seller' | 'refund_to_buyer'
) {
  const { supabase, userId } = await requireAdmin()

  const { data: dispute } = await supabase
    .from('disputes')
    .select('order_id')
    .eq('id', disputeId)
    .single()
  if (!dispute) return { error: 'Dispute not found' }

  const { data: order } = await supabase
    .from('orders')
    .select('seller_id, buyer_id, amount, currency, platform_fee_pct')
    .eq('id', dispute.order_id)
    .single()
  if (!order) return { error: 'Order not found' }

  if (resolution === 'release_to_seller') {
    const fee = (order.amount * order.platform_fee_pct) / 100
    const sellerAmount = order.amount - fee
    await supabase.rpc('increment_seller_balance', {
      p_seller_id: order.seller_id,
      p_currency: order.currency,
      p_amount: sellerAmount,
    })
    await supabase.from('orders').update({ status: 'completed' }).eq('id', dispute.order_id)
  } else {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', dispute.order_id)
  }

  await supabase.from('disputes').update({
    status: 'resolved',
    resolution,
    resolved_by: userId,
    resolved_at: new Date().toISOString(),
  }).eq('id', disputeId)

  revalidatePath('/admin/disputes')
  return { success: true }
}

export async function processPayout(
  sellerId: string,
  currency: string,
  walletAddress: string,
  txHash: string
) {
  const { supabase, userId } = await requireAdmin()

  const { data: balance } = await supabase
    .from('seller_balances')
    .select('pending_amount')
    .eq('seller_id', sellerId)
    .eq('currency', currency)
    .single()
  if (!balance || balance.pending_amount <= 0) return { error: 'No balance to payout' }

  await supabase.from('payouts').insert({
    seller_id: sellerId,
    amount: balance.pending_amount,
    currency,
    wallet_address: walletAddress,
    tx_hash: txHash,
    processed_by: userId,
  })

  await supabase.from('seller_balances')
    .update({ pending_amount: 0 })
    .eq('seller_id', sellerId)
    .eq('currency', currency)

  revalidatePath('/admin/payouts')
  return { success: true }
}
