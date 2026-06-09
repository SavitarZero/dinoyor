'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addComment(listingId: string, body: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthenticated' }

  const { data: completedOrders } = await supabase
    .from('orders')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .eq('status', 'completed')

  if (!completedOrders?.length) return { error: 'purchase_required' }

  const { data: existingReviews } = await supabase
    .from('listing_comments')
    .select('order_id')
    .eq('listing_id', listingId)
    .eq('user_id', user.id)

  const reviewedOrderIds = new Set((existingReviews ?? []).map(r => r.order_id).filter(Boolean))
  const unreviewedOrder = completedOrders.find(o => !reviewedOrderIds.has(o.id))

  if (!unreviewedOrder) return { error: 'already_reviewed' }

  const trimmed = body.trim()
  if (trimmed.length < 1 || trimmed.length > 500) return { error: 'invalid_body' }

  await supabase.from('listing_comments').insert({
    user_id: user.id,
    listing_id: listingId,
    body: trimmed,
    order_id: unreviewedOrder.id,
  })
  revalidatePath(`/market/${listingId}`)
  return {}
}
