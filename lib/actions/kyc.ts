'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitKYC(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const phone = formData.get('phone') as string
  const idCardFile = formData.get('id_card') as File
  if (!phone || !idCardFile || idCardFile.size === 0) return { error: 'Missing required fields' }

  const ext = idCardFile.name.split('.').pop()
  const path = `${user.id}/id-card.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('kyc-documents')
    .upload(path, idCardFile, { upsert: true })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(path)

  const { error: insertError } = await supabase.from('kyc_submissions').upsert({
    user_id: user.id,
    phone,
    id_card_url: publicUrl,
    status: 'pending',
  }, { onConflict: 'user_id' })
  if (insertError) return { error: insertError.message }

  await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', user.id)

  revalidatePath('/profile/kyc')
  return { success: 'KYC submitted. We will review within 1-2 business days.' }
}
