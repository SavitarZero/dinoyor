'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function requestPayout(currency: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('wallet_address, wallet_network, kyc_status')
    .eq('id', user.id)
    .single()

  if (profile?.kyc_status !== 'approved') return { error: 'KYC approval required' }
  if (!profile?.wallet_address) return { error: 'Please set your payout wallet address first' }

  const { data: balance } = await supabase
    .from('seller_balances')
    .select('pending_amount')
    .eq('seller_id', user.id)
    .eq('currency', currency)
    .single()

  if (!balance || balance.pending_amount <= 0) return { error: 'No balance available' }

  const { data: existing } = await supabase
    .from('payout_requests')
    .select('id')
    .eq('seller_id', user.id)
    .eq('currency', currency)
    .eq('status', 'pending')
    .single()
  if (existing) return { error: 'You already have a pending payout request' }

  await supabase.from('payout_requests').insert({
    seller_id: user.id,
    amount: balance.pending_amount,
    currency,
    wallet_address: profile.wallet_address,
  })

  revalidatePath('/wallet')
  return { success: true }
}

export async function approvePayoutRequest(requestId: string, txHash: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data: req } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('id', requestId)
    .single()
  if (!req || req.status !== 'pending') return { error: 'Request not found or already processed' }

  const admin = createAdminClient()

  const { data: payout } = await admin.from('payouts').insert({
    seller_id: req.seller_id,
    amount: req.amount,
    currency: req.currency,
    wallet_address: req.wallet_address,
    tx_hash: txHash,
    processed_by: user.id,
  }).select('id').single()

  await admin.from('seller_balances')
    .update({ pending_amount: 0 })
    .eq('seller_id', req.seller_id)
    .eq('currency', req.currency)

  await admin.from('balance_transactions').insert({
    seller_id: req.seller_id,
    payout_id: payout?.id,
    type: 'debit',
    amount: req.amount,
    currency: req.currency,
    note: 'Payout approved',
  })

  await admin.from('payout_requests').update({
    status: 'approved',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    payout_id: payout?.id,
  }).eq('id', requestId)

  revalidatePath('/admin/payouts')
  return { success: true }
}

export async function rejectPayoutRequest(requestId: string, note: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  await supabase.from('payout_requests').update({
    status: 'rejected',
    note,
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
  }).eq('id', requestId)

  revalidatePath('/admin/payouts')
  return { success: true }
}
