'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateWalletAddress(address: string, network: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmed = address.trim()
  if (!trimmed) return { error: 'Wallet address is required' }
  if (!['TRC20', 'ERC20', 'BEP20'].includes(network)) return { error: 'Invalid network' }

  const { error } = await supabase
    .from('profiles')
    .update({ wallet_address: trimmed, wallet_network: network })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/earnings')
  revalidatePath('/profile')
  return { success: true }
}

export async function deleteWalletAddress() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ wallet_address: null, wallet_network: null })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/earnings')
  revalidatePath('/profile')
  return { success: true }
}
