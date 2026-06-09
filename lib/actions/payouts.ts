'use server'
import { createClient } from '@/lib/supabase/server'
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
    .select('available_amount')
    .eq('seller_id', user.id)
    .eq('currency', currency)
    .single()

  if (!balance || balance.available_amount <= 0) return { error: 'No available balance. Funds are held for 7 days after each sale.' }

  const { count: completedSales } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('seller_id', user.id)
    .eq('status', 'completed')
  if ((completedSales ?? 0) < 1) {
    return { error: 'At least 1 completed sale is required before withdrawing' }
  }

  const { data: settingsRows } = await supabase
    .from('platform_settings')
    .select('key, value')
    .eq('key', 'min_withdraw_amo')
  const minWithdraw = Number(settingsRows?.[0]?.value ?? 200)
  if (Number(balance.available_amount) < minWithdraw) {
    return { error: `Minimum withdrawal is ${minWithdraw} coin` }
  }

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
    amount: balance.available_amount,
    currency,
    wallet_address: profile.wallet_address,
  })

  revalidatePath('/wallet')
  return { success: true }
}

export async function updatePayoutSettings(minAmount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (minAmount < 1) return { error: 'Minimum payout must be at least 1 coin' }

  await supabase.from('profiles')
    .update({ payout_min_amount: minAmount })
    .eq('id', user.id)

  revalidatePath('/wallet')
  return { success: true }
}
