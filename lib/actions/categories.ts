'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Not authorized')
  return supabase
}

export async function addCategory(formData: FormData) {
  const name = (formData.get('name') as string).trim()
  if (!name) return { error: 'Name is required' }

  const supabase = await requireAdmin()
  const maxOrder = await supabase
    .from('categories')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextOrder = (maxOrder.data?.sort_order ?? 0) + 1

  const { error } = await supabase.from('categories').insert({ name, sort_order: nextOrder })
  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
}

export async function deleteCategory(id: string) {
  const supabase = await requireAdmin()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/categories')
}

export async function toggleCategory(id: string, active: boolean) {
  const supabase = await requireAdmin()
  await supabase.from('categories').update({ active }).eq('id', id)
  revalidatePath('/admin/categories')
}

export async function updateCategoryOrder(id: string, sort_order: number) {
  const supabase = await requireAdmin()
  await supabase.from('categories').update({ sort_order }).eq('id', id)
  revalidatePath('/admin/categories')
}
