'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveDepositWallet(walletAddress: string, network: 'TRC20' | 'ERC20') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = walletAddress.trim()
  if (!trimmed) return { error: 'Wallet address is required' }

  const { error } = await supabase.from('profiles').update({
    deposit_wallet: trimmed,
    deposit_wallet_network: network,
  }).eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/wallet')
  return { success: true }
}

export async function submitDeposit(
  txHash: string,
  network: 'TRC20' | 'ERC20',
  claimedAmount: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Sender address must match the pre-registered deposit wallet
  const { data: profile } = await supabase
    .from('profiles')
    .select('deposit_wallet, deposit_wallet_network')
    .eq('id', user.id)
    .single()

  if (!profile?.deposit_wallet) {
    return { error: 'You must register your deposit wallet address first before submitting a deposit.' }
  }
  if (profile.deposit_wallet_network !== network) {
    return { error: `Your registered deposit wallet is ${profile.deposit_wallet_network}. Please select that network or update your wallet.` }
  }

  const trimmedTx = txHash.trim()
  if (!trimmedTx) return { error: 'Transaction hash is required' }
  if (claimedAmount <= 0) return { error: 'Amount must be greater than 0' }

  // Fetch min deposit from platform settings
  const { data: minRows } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'min_deposit_amo')
    .single()
  const minDeposit = Number(minRows?.value ?? 10)
  if (claimedAmount < minDeposit) {
    return { error: `Minimum deposit is ${minDeposit} coin` }
  }

  // Prevent reuse of an already-approved TX hash (globally, not just per user)
  const { data: existing } = await supabase
    .from('deposit_requests')
    .select('id, status')
    .eq('tx_hash', trimmedTx)
    .maybeSingle()
  if (existing?.status === 'approved') return { error: 'This TX hash has already been credited' }
  if (existing?.status === 'pending')  return { error: 'This TX hash is already pending review' }

  const { error } = await supabase.from('deposit_requests').insert({
    user_id: user.id,
    tx_hash: trimmedTx,
    network,
    claimed_amount: claimedAmount,
    sender_address: profile.deposit_wallet,
    currency: 'USDT',
  })
  if (error) return { error: error.message }

  revalidatePath('/wallet')
  return { success: true }
}

export async function getUserBalance(currency = 'USDT') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data } = await supabase
    .from('user_balances')
    .select('balance')
    .eq('user_id', user.id)
    .eq('currency', currency)
    .maybeSingle()

  return Number(data?.balance ?? 0)
}
