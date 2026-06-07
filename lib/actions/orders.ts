'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createOrder(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, seller_id, price_amount, price_currency, status, title, delivery_time')
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
    platform_fee_pct: feePct,
    status: 'awaiting_payment',
  }).select('id').single()

  if (error) return { error: error.message }
  await supabase.from('listings').update({ status: 'sold' }).eq('id', listingId)

  // Create conversation + system message
  const admin = createAdminClient()
  const { data: conv } = await admin.from('conversations').insert({
    order_id: order.id,
    buyer_id: user.id,
    seller_id: listing.seller_id,
  }).select('id').single()

  if (conv) {
    const deliveryNote = listing.delivery_time
      ? `\nEstimated delivery: ${listing.delivery_time}`
      : ''
    await admin.from('messages').insert({
      conversation_id: conv.id,
      sender_id: null,
      body: `Order created\n\nItem: ${listing.title}\nPrice: $${listing.price_amount} USD\nOrder ID: #${order.id.slice(0, 8).toUpperCase()}${deliveryNote}\n\nUse this chat to coordinate delivery. Payment must be sent to escrow before the seller delivers.`,
    })
  }

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
    p_currency: 'USD',
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
