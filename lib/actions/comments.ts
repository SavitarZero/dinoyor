'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addComment(listingId: string, body: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const { data: order } = await supabase
    .from('orders')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .eq('status', 'completed')
    .maybeSingle()
  if (!order) return { error: 'purchase_required' }

  const trimmed = body.trim()
  if (trimmed.length < 1 || trimmed.length > 500) return { error: 'invalid_body' }

  await supabase.from('listing_comments').insert({ user_id: user.id, listing_id: listingId, body: trimmed })
  revalidatePath(`/market/${listingId}`)
  return {}
}
