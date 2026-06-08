'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function submitKYC(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const photoFile = formData.get('id_card') as File
  if (!photoFile || photoFile.size === 0) return { error: 'Please upload a photo of yourself holding your ID card.' }

  const email = (formData.get('email') as string | null)?.trim() || null
  if (email) {
    const { error: emailError } = await supabase.auth.updateUser({ email })
    if (emailError) return { error: emailError.message }
  }

  const ext = photoFile.name.split('.').pop()
  const path = `${user.id}/id-card.${ext}`
  const admin = createAdminClient()
  const { error: uploadError } = await admin.storage
    .from('kyc-documents')
    .upload(path, photoFile, { upsert: true })
  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = supabase.storage.from('kyc-documents').getPublicUrl(path)

  const { error: insertError } = await supabase.from('kyc_submissions').upsert({
    user_id: user.id,
    phone: '',
    id_card_url: publicUrl,
    status: 'pending',
  }, { onConflict: 'user_id' })
  if (insertError) return { error: insertError.message }

  await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('id', user.id)

  revalidatePath('/profile/kyc')
  revalidatePath('/profile')
  return { success: 'Submitted! We will review your application within 1–2 business days.' }
}
