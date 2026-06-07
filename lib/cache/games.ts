import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export type CachedGame = {
  id: string
  name: string
  slug: string
  category: string | null
  logo_url: string | null
  banner_url: string | null
}

export const getCachedGames = unstable_cache(
  async (): Promise<CachedGame[]> => {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from('games')
      .select('id, name, slug, category, logo_url, banner_url')
      .order('name')
    return (data ?? []) as CachedGame[]
  },
  ['games-list'],
  { revalidate: 300 }
)
