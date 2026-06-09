'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { verifyTrc20Deposit, verifyErc20Deposit } from '@/lib/blockchain/verify'

const walletCol = (network: 'TRC20' | 'ERC20') =>
  network === 'TRC20' ? 'deposit_wallet_trc20' : 'deposit_wallet_erc20'

export async function saveDepositWallet(walletAddress: string, network: 'TRC20' | 'ERC20') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = walletAddress.trim()
  if (!trimmed) return { error: 'Wallet address is required' }

  // Check uniqueness: same address on same network cannot belong to two accounts
  const admin = createAdminClient()
  const col = walletCol(network)
  const { data: conflict } = await admin
    .from('profiles')
    .select('id')
    .ilike(col, trimmed)
    .neq('id', user.id)
    .maybeSingle()

  if (conflict) return { error: 'This wallet address is already registered by another account' }

  const { error } = await supabase.from('profiles').update({
    [col]: trimmed,
  }).eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/wallet')
  revalidatePath('/profile')
  return { success: true }
}

export async function deleteDepositWallet(network: 'TRC20' | 'ERC20') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('profiles').update({
    [walletCol(network)]: null,
  }).eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/wallet')
  revalidatePath('/profile')
  return { success: true }
}

export async function submitDeposit(txHash: string, network: 'TRC20' | 'ERC20') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmedTx = txHash.trim()
  if (!trimmedTx) return { error: 'Transaction hash is required' }

  const col = walletCol(network)
  const { data: profile } = await supabase
    .from('profiles')
    .select(`${col}`)
    .eq('id', user.id)
    .single()

  const senderAddress = (profile as Record<string, string | null> | null)?.[col] ?? null
  if (!senderAddress) {
    return { error: `Register your ${network} sender wallet address first` }
  }

  // Fetch platform settings (escrow address + min deposit)
  const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET === 'true'
  const trc20Key = isTestnet ? 'escrow_wallet_trc20_testnet' : 'escrow_wallet_trc20'
  const erc20Key = isTestnet ? 'escrow_wallet_erc20_testnet' : 'escrow_wallet_erc20'

  const { data: settingsRows } = await supabase
    .from('platform_settings')
    .select('key, value')
    .in('key', ['min_deposit_amo', trc20Key, erc20Key])

  const settings = Object.fromEntries((settingsRows ?? []).map(r => [r.key, r.value as string]))
  const minDeposit = Number(settings['min_deposit_amo'] ?? 10)
  const escrowAddress = network === 'TRC20' ? settings[trc20Key] : settings[erc20Key]

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
    ? await verifyTrc20Deposit(trimmedTx, senderAddress, escrowAddress, minDeposit)
    : await verifyErc20Deposit(trimmedTx, senderAddress, escrowAddress, minDeposit)

  if (!verification.ok) return { error: verification.error }

  const verifiedAmount = verification.verifiedAmount!
  const admin = createAdminClient()

  const { error: insertErr } = await admin.from('deposit_requests').insert({
    user_id: user.id,
    tx_hash: trimmedTx,
    network,
    claimed_amount: verifiedAmount,
    approved_amount: verifiedAmount,
    sender_address: senderAddress,
    currency: 'USDT',
    status: 'approved',
    reviewed_at: new Date().toISOString(),
  })
  if (insertErr) return { error: insertErr.message }

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
