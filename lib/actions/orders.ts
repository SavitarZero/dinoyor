'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createNotification } from '@/lib/utils/notifications'

function deliveryMs(deliveryTime: string | null | undefined): number {
  if (!deliveryTime) return 24 * 60 * 60 * 1000
  switch (deliveryTime) {
    case '30min': return 30 * 60 * 1000
    case '1-3h':  return 3 * 60 * 60 * 1000
    case '3-5h':  return 5 * 60 * 60 * 1000
    case '6-12h': return 12 * 60 * 60 * 1000
    case '1day':  return 24 * 60 * 60 * 1000
    default:      return 24 * 60 * 60 * 1000
  }
}

export async function createOrder(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, seller_id, price_amount, price_currency, status, title, delivery_time')
    .eq('id', listingId)
    .single()
  if (!listing) return { error: 'Listing not found' }
  if (listing.seller_id === user.id) return { error: 'Cannot buy your own listing' }
  if (listing.status !== 'active') {
    return { error: 'This item has already been sold or is no longer available.' }
  }

  // Atomically mark listing as sold (only if still active) — prevents race condition
  const admin = createAdminClient()
  const { data: locked, error: lockErr } = await admin
    .from('listings')
    .update({ status: 'sold' })
    .eq('id', listingId)
    .eq('status', 'active')
    .select('id')
    .maybeSingle()
  if (lockErr || !locked) {
    return { error: 'This item has already been purchased by another buyer. Please try another listing.' }
  }

  // Check buyer balance
  const currency = 'USDT'
  const { data: balanceRow } = await supabase
    .from('user_balances')
    .select('balance')
    .eq('user_id', user.id)
    .eq('currency', currency)
    .maybeSingle()
  const currentBalance = Number(balanceRow?.balance ?? 0)
  if (currentBalance < listing.price_amount) {
    return { error: `Insufficient balance. You have ${currentBalance} coin, need ${listing.price_amount} coin. Please top up your wallet.` }
  }

  // Deduct from buyer balance atomically
  const { data: ok } = await supabase.rpc('decrement_user_balance', {
    p_user_id: user.id,
    p_currency: currency,
    p_amount: listing.price_amount,
  })
  if (!ok) return { error: 'Balance deduction failed — please try again' }

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'platform_fee_pct')
    .single()
  const feePct = parseFloat(settings?.value ?? '5.00')

  const deliveryDeadlineAt = new Date(Date.now() + deliveryMs(listing.delivery_time)).toISOString()

  const { data: order, error } = await supabase.from('orders').insert({
    listing_id: listingId,
    buyer_id: user.id,
    seller_id: listing.seller_id,
    amount: listing.price_amount,
    platform_fee_pct: feePct,
    status: 'paid_escrow',
    delivery_deadline_at: deliveryDeadlineAt,
  }).select('id').single()

  if (error) {
    // Rollback: refund buyer balance and restore listing
    await supabase.rpc('increment_user_balance', {
      p_user_id: user.id, p_currency: currency, p_amount: listing.price_amount,
    })
    await admin.from('listings').update({ status: 'active' }).eq('id', listingId)
    return { error: error.message }
  }

  const { data: conv } = await admin.from('conversations').insert({
    order_id: order.id,
    buyer_id: user.id,
    seller_id: listing.seller_id,
  }).select('id').single()

  if (conv) {
    const deliveryNote = listing.delivery_time ? `\nEstimated delivery: ${listing.delivery_time}` : ''
    await admin.from('messages').insert({
      conversation_id: conv.id,
      sender_id: null,
      body: `Order created\n\nItem: ${listing.title}\nPrice: ${listing.price_amount} coin\nOrder ID: #${order.id.slice(0, 8).toUpperCase()}${deliveryNote}\n\nPayment deducted from buyer's balance. Seller, please deliver the item.`,
    })
  }

  // Notify seller: new order
  await createNotification({ userId: listing.seller_id, type: 'new_order', title: 'New order received', body: listing.title, link: `/orders/${order.id}` })

  revalidatePath('/orders')
  redirect(`/orders/${order.id}`)
}

export async function confirmDelivery(orderId: string, screenshotFiles: File[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, seller_id, buyer_id, status, listing_id')
    .eq('id', orderId)
    .single()
  if (!order || order.seller_id !== user.id) return { error: 'Unauthorized' }
  if (order.status !== 'paid_escrow') return { error: 'Order not in correct state' }

  const urls: string[] = []
  const admin = createAdminClient()
  for (const file of screenshotFiles) {
    if (file.size === 0) continue
    const path = `${orderId}/${Date.now()}-${file.name}`
    const { error } = await admin.storage.from('order-proofs').upload(path, file)
    if (error) return { error: error.message }
    const { data: { publicUrl } } = admin.storage.from('order-proofs').getPublicUrl(path)
    urls.push(publicUrl)
  }
  if (urls.length === 0) return { error: 'At least one screenshot required' }

  await admin.from('order_proofs').insert({ order_id: orderId, screenshot_urls: urls })

  // Buyer has X days to confirm after delivery, then auto-release to seller
  const { data: autoReleaseSetting } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', 'auto_release_days')
    .single()
  const autoReleaseDays = Number(autoReleaseSetting?.value ?? 3)
  const autoReleaseAt = new Date(Date.now() + autoReleaseDays * 24 * 60 * 60 * 1000).toISOString()

  await admin.from('orders').update({
    status: 'delivered',
    auto_release_at: autoReleaseAt,
  }).eq('id', orderId)

  // Notify buyer: seller delivered
  await createNotification({ userId: order.buyer_id, type: 'seller_delivered', title: 'Item delivered', body: 'Seller has delivered your item. Please confirm receipt.', link: `/orders/${orderId}` })

  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

export async function creditSeller(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  sellerId: string,
  amount: number,
  holdDays: number,
) {
  const admin = createAdminClient()
  const availableAt = new Date(Date.now() + holdDays * 24 * 60 * 60 * 1000).toISOString()
  await admin.rpc('increment_seller_balance', {
    p_seller_id: sellerId,
    p_currency: 'USDT',
    p_amount: amount,
  })
  await admin.from('balance_transactions').insert({
    seller_id: sellerId,
    order_id: orderId,
    type: 'credit',
    amount,
    currency: 'USDT',
    note: `Order #${orderId.slice(0, 8).toUpperCase()} completed`,
    available_at: availableAt,
    hold_released: false,
  })
}

export async function buyerConfirmReceived(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, seller_id, amount, platform_fee_pct, status')
    .eq('id', orderId)
    .single()
  if (!order || order.buyer_id !== user.id) return { error: 'Unauthorized' }
  if (order.status !== 'delivered') return { error: 'Order not in correct state' }

  const [{ data: flatFeeRow }, { data: holdRow }] = await Promise.all([
    supabase.from('platform_settings').select('value').eq('key', 'platform_flat_fee').single(),
    supabase.from('platform_settings').select('value').eq('key', 'payout_hold_days').single(),
  ])
  const flatFee = Number(flatFeeRow?.value ?? 1)
  const holdDays = Number(holdRow?.value ?? 7)

  const fee = (order.amount * order.platform_fee_pct) / 100
  const sellerAmount = Math.max(0, order.amount - fee - flatFee)

  const admin = createAdminClient()
  await admin.from('orders').update({ status: 'completed' }).eq('id', orderId)
  await Promise.all([
    creditSeller(admin, orderId, order.seller_id, sellerAmount, holdDays),
    admin.from('platform_revenue').insert({
      order_id: orderId,
      fee_pct:  order.platform_fee_pct,
      flat_fee: flatFee,
      amount:   fee + flatFee,
      currency: 'USDT',
    }),
  ])

  revalidatePath(`/orders/${orderId}`)

  // Notify both: order completed
  await createNotification({ userId: order.seller_id, type: 'order_completed', title: 'Order completed', body: 'Buyer confirmed receipt. Payment released to your balance.', link: `/orders/${orderId}` })
  await createNotification({ userId: order.buyer_id, type: 'buyer_confirmed', title: 'Order completed', body: 'You confirmed receipt. Thank you!', link: `/orders/${orderId}` })

  return { success: true }
}

export async function notifyPaymentSent(orderId: string, txHash: string, network: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const trimmedTx = txHash.trim()
  if (!trimmedTx) return { error: 'Transaction hash is required' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, seller_id, status, amount')
    .eq('id', orderId)
    .single()
  if (!order || order.buyer_id !== user.id) return { error: 'Unauthorized' }
  if (order.status !== 'awaiting_payment') return { error: 'Order not awaiting payment' }

  await supabase.from('orders').update({
    payment_notified_at: new Date().toISOString(),
    payment_tx_hash: trimmedTx,
    payment_network: network,
  }).eq('id', orderId)

  const admin = createAdminClient()
  const { data: conv } = await admin.from('conversations').select('id').eq('order_id', orderId).single()
  if (conv) {
    await admin.from('messages').insert({
      conversation_id: conv.id,
      sender_id: null,
      body: `Payment submitted by buyer\nNetwork: ${network}\nTX: ${trimmedTx}\n\nWaiting for admin confirmation.`,
    })
  }

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

export async function cancelOrder(orderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, seller_id, amount, status, listing_id, delivery_deadline_at')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Order not found' }
  if (order.buyer_id !== user.id && order.seller_id !== user.id) return { error: 'Unauthorized' }
  if (order.status !== 'paid_escrow') return { error: 'Can only cancel orders that are pending delivery' }

  const isBuyer = order.buyer_id === user.id

  if (isBuyer) {
    const deadline = order.delivery_deadline_at
      ? new Date(order.delivery_deadline_at)
      : null
    if (!deadline || new Date() < deadline) {
      return { error: 'You can cancel after the delivery deadline has passed.' }
    }
  }

  const admin = createAdminClient()
  await admin.rpc('increment_user_balance', {
    p_user_id: order.buyer_id,
    p_currency: 'USDT',
    p_amount: order.amount,
  })

  await admin.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
  await admin.from('listings').update({ status: 'active' }).eq('id', order.listing_id)

  revalidatePath(`/orders/${orderId}`)
  revalidatePath('/orders')
  return { success: true }
}
