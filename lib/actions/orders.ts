'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createOrder(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, seller_id, price_amount, price_currency, status')
    .eq('id', listingId)
    .single()
  if (!listing || listing.status !== 'active') return { error: 'Listing not available' }
  if (listing.seller_id === user.id) return { error: 'Cannot buy your own listing' }

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_fee_pct')
    .single()
  const feePct = parseFloat(settings?.value ?? '5.00')

  const { data: order, error } = await supabase.from('orders').insert({
    listing_id: listingId,
    buyer_id: user.id,
    seller_id: listing.seller_id,
    amount: listing.price_amount,
    currency: listing.price_currency,
    platform_fee_pct: feePct,
    status: 'awaiting_payment',
  }).select('id').single()

  if (error) return { error: error.message }
  await supabase.from('listings').update({ status: 'sold' }).eq('id', listingId)

  revalidatePath('/orders')
  redirect(`/orders/${order.id}`)
}

export async function confirmDelivery(orderId: string, screenshotFiles: File[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, seller_id, status')
    .eq('id', orderId)
    .single()
  if (!order || order.seller_id !== user.id) return { error: 'Unauthorized' }
  if (order.status !== 'paid_escrow') return { error: 'Order not in correct state' }

  const urls: string[] = []
  for (const file of screenshotFiles) {
    if (file.size === 0) continue
    const path = `${orderId}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('order-proofs').upload(path, file)
    if (error) return { error: error.message }
    const { data: { publicUrl } } = supabase.storage.from('order-proofs').getPublicUrl(path)
    urls.push(publicUrl)
  }
  if (urls.length === 0) return { error: 'At least one screenshot required' }

  await supabase.from('order_proofs').insert({ order_id: orderId, screenshot_urls: urls })

  const autoReleaseAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  await supabase.from('orders').update({
    status: 'delivered',
    auto_release_at: autoReleaseAt,
  }).eq('id', orderId)

  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

export async function buyerConfirmReceived(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, seller_id, amount, currency, platform_fee_pct, status')
    .eq('id', orderId)
    .single()
  if (!order || order.buyer_id !== user.id) return { error: 'Unauthorized' }
  if (order.status !== 'delivered') return { error: 'Order not in correct state' }

  const fee = (order.amount * order.platform_fee_pct) / 100
  const sellerAmount = order.amount - fee

  await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId)

  await supabase.rpc('increment_seller_balance', {
    p_seller_id: order.seller_id,
    p_currency: order.currency,
    p_amount: sellerAmount,
  })

  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

export async function openDispute(orderId: string, reason: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, status')
    .eq('id', orderId)
    .single()
  if (!order || order.buyer_id !== user.id) return { error: 'Unauthorized' }
  if (order.status !== 'delivered') return { error: 'Can only dispute delivered orders' }

  await supabase.from('disputes').insert({ order_id: orderId, opened_by: user.id, reason })
  await supabase.from('orders').update({ status: 'disputed' }).eq('id', orderId)

  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}
