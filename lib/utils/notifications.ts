import { createAdminClient } from '@/lib/supabase/admin'

interface CreateNotificationParams {
  userId: string
  type: 'new_order' | 'seller_delivered' | 'buyer_confirmed' | 'order_completed' | 'order_cancelled' | 'system'
  title: string
  body?: string
  link?: string
}

export async function createNotification({ userId, type, title, body, link }: CreateNotificationParams) {
  const admin = createAdminClient()
  await admin.from('notifications').insert({ user_id: userId, type, title, body, link })
}
