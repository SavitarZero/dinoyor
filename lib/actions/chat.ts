'use server'
import { createClient } from '@/lib/supabase/server'

export async function sendMessage(conversationId: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }
  if (!body.trim()) return { error: 'Message cannot be empty' }

  const { error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: body.trim(),
  })
  if (error) return { error: error.message }
  return { success: true }
}
