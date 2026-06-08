'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { verifyTrc20Deposit, verifyErc20Deposit } from '@/lib/blockchain/verify'

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

export async function submitDeposit(txHash: string, network: 'TRC20' | 'ERC20') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmedTx = txHash.trim()
  if (!trimmedTx) return { error: 'Transaction hash is required' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('deposit_wallet, deposit_wallet_network')
    .eq('id', user.id)
    .single()

  if (!profile?.deposit_wallet) {
    return { error: 'You must register your deposit wallet address first' }
  }
  if (profile.deposit_wallet_network !== network) {
    return { error: `Your registered deposit wallet is on ${profile.deposit_wallet_network}. Switch to that network or update your wallet.` }
  }

  // Fetch platform settings (escrow address + min deposit)
  const { data: settingsRows } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['min_deposit_amo', 'escrow_wallet_trc20', 'escrow_wallet_erc20'])

  const settings = Object.fromEntries((settingsRows ?? []).map(r => [r.key, r.value as string]))
  const minDeposit = Number(settings['min_deposit_amo'] ?? 10)
  const escrowAddress = network === 'TRC20'
    ? settings['escrow_wallet_trc20']
    : settings['escrow_wallet_erc20']

  if (!escrowAddress) {
    return { error: 'Platform deposit address is not configured — contact support' }
  }

  // Prevent re-use of an already-processed TX hash
  const { data: existing } = await supabase
    .from('deposit_requests')
    .select('id, status')
    .eq('tx_hash', trimmedTx)
    .maybeSingle()

  if (existing?.status === 'approved') return { error: 'This transaction has already been credited' }
  if (existing?.status === 'pending') return { error: 'This transaction is already pending review' }

  // On-chain verification
  const verification = network === 'TRC20'
    ? await verifyTrc20Deposit(trimmedTx, profile.deposit_wallet, escrowAddress, minDeposit)
    : await verifyErc20Deposit(trimmedTx, profile.deposit_wallet, escrowAddress, minDeposit)

  if (!verification.ok) return { error: verification.error }

  const verifiedAmount = verification.verifiedAmount!
  const admin = createAdminClient()

  // Record deposit as auto-approved
  const { error: insertErr } = await admin.from('deposit_requests').insert({
    user_id: user.id,
    tx_hash: trimmedTx,
    network,
    claimed_amount: verifiedAmount,
    approved_amount: verifiedAmount,
    sender_address: profile.deposit_wallet,
    currency: 'USDT',
    status: 'approved',
    reviewed_at: new Date().toISOString(),
  })
  if (insertErr) return { error: insertErr.message }

  // Credit buyer balance atomically
  await admin.rpc('increment_user_balance', {
    p_user_id: user.id,
    p_currency: 'USDT',
    p_amount: verifiedAmount,
  })

  revalidatePath('/wallet')
  return { success: true, amount: verifiedAmount }
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
