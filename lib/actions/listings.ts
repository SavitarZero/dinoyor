'use server'
import { createClient } from '@/lib/supabase/server'
import { moderateImage } from '@/lib/moderation'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_status')
    .eq('id', user.id)
    .single()
  if (profile?.kyc_status !== 'approved') return { error: 'KYC approval required to create listings' }

  const title = formData.get('title') as string
  const gameId = formData.get('game_id') as string
  const priceAmount = parseFloat(formData.get('price_amount') as string)
  const priceCurrency = formData.get('price_currency') as string
  const description = formData.get('description') as string
  const deliveryTime = (formData.get('delivery_time') as string) || null
  const itemTypeId  = (formData.get('item_type_id')  as string) || null
  const categoryId  = (formData.get('category_id')   as string) || null
  const coverFile = formData.get('cover') as File | null
  const additionalFiles = formData.getAll('additional') as File[]

  if (!title || !gameId || isNaN(priceAmount) || priceAmount < 10) {
    return { error: priceAmount < 10 ? 'Minimum price is 10 coin' : 'Missing required fields' }
  }
  if (!coverFile || coverFile.size === 0) return { error: 'Cover image is required' }
  if (coverFile.size > 2 * 1024 * 1024) return { error: 'Cover image must be under 2 MB' }

  const validAdditional = additionalFiles.filter(f => f.size > 0)
  if (validAdditional.length > 5) return { error: 'Maximum 5 additional images' }
  for (const f of validAdditional) {
    if (f.size > 3 * 1024 * 1024) return { error: `"${f.name}" exceeds 3 MB limit` }
  }

  // Moderate all images in parallel before uploading anything
  const allFiles = [coverFile, ...validAdditional]
  const moderationResults = await Promise.all(allFiles.map(f => moderateImage(f)))
  const flagged = moderationResults.find(r => r !== null)
  if (flagged) return { error: flagged }

  async function uploadFile(file: File): Promise<string | { error: string }> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${user!.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('item-images').upload(path, file)
    if (error) return { error: error.message }
    return supabase.storage.from('item-images').getPublicUrl(path).data.publicUrl
  }

  const coverResult = await uploadFile(coverFile)
  if (typeof coverResult !== 'string') return coverResult

  const imageUrls: string[] = [coverResult]
  for (const file of validAdditional) {
    const result = await uploadFile(file)
    if (typeof result !== 'string') return result
    imageUrls.push(result)
  }

  if (imageUrls.length === 0) return { error: 'At least one image required' }

  const { data, error } = await supabase.from('listings').insert({
    seller_id: user.id,
    game_id: gameId,
    item_type_id: itemTypeId,
    category_id: categoryId,
    title,
    description: description || null,
    delivery_time: deliveryTime,
    price_amount: priceAmount,
    price_currency: priceCurrency,
    images: imageUrls,
  }).select('id').single()

  if (error) return { error: error.message }
  revalidatePath('/listings')
  redirect(`/market/${data.id}`)
}

export async function cancelListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('listings')
    .update({ status: 'cancelled' })
    .eq('id', listingId)
    .eq('seller_id', user.id)
  if (error) return { error: error.message }
  revalidatePath('/listings')
  return { success: true }
}
