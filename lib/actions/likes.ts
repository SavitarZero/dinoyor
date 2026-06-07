'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleLike(listingId: string): Promise<{ liked?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const { data: profile } = await supabase
    .from('profiles').select('kyc_status').eq('id', user.id).single()
  if (profile?.kyc_status !== 'approved') return { error: 'kyc_required' }

  const { data: existing } = await supabase
    .from('listing_likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('listing_id', listingId)
    .maybeSingle()

  if (existing) {
    await supabase.from('listing_likes').delete().eq('user_id', user.id).eq('listing_id', listingId)
    revalidatePath(`/market/${listingId}`)
    return { liked: false }
  } else {
    await supabase.from('listing_likes').insert({ user_id: user.id, listing_id: listingId })
    revalidatePath(`/market/${listingId}`)
    return { liked: true }
  }
}
