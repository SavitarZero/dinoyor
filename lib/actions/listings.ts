'use server'
import { createClient } from '@/lib/supabase/server'
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
  if (profile?.kyc_status !== 'approved') return { error: 'KYC verification required to list items' }

  const title = formData.get('title') as string
  const gameId = formData.get('game_id') as string
  const priceAmount = parseFloat(formData.get('price_amount') as string)
  const priceCurrency = formData.get('price_currency') as string
  const description = formData.get('description') as string
  const deliveryTime = (formData.get('delivery_time') as string) || null
  const imageFiles = formData.getAll('images') as File[]

  if (!title || !gameId || isNaN(priceAmount) || priceAmount <= 0) {
    return { error: 'Missing required fields' }
  }

  const imageUrls: string[] = []
  for (const file of imageFiles) {
    if (file.size === 0) continue
    const path = `${user.id}/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('item-images').upload(path, file)
    if (error) return { error: error.message }
    const { data: { publicUrl } } = supabase.storage.from('item-images').getPublicUrl(path)
    imageUrls.push(publicUrl)
  }

  if (imageUrls.length === 0) return { error: 'At least one image required' }

  const { data, error } = await supabase.from('listings').insert({
    seller_id: user.id,
    game_id: gameId,
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
