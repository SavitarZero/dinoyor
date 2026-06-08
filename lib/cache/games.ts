import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

export type CachedGame = {
  id: string
  name: string
  slug: string
  category: string | null
  category_id: string | null
  logo_url: string | null
  banner_url: string | null
}

export const getCachedGames = unstable_cache(
  async (): Promise<CachedGame[]> => {
    const supabase = createAdminClient()
    const [{ data: gamesData, error: gErr }, { data: catsData }] = await Promise.all([
      supabase.from('games').select('*').order('name'),
      supabase.from('categories').select('id, name'),
    ])
    if (gErr) console.error('[getCachedGames] games query error:', gErr.message)
    const catMap = new Map((catsData ?? []).map((c: { id: string; name: string }) => [c.id, c.name]))
    return (gamesData ?? []).map((g: Record<string, unknown>) => ({
      id: String(g.id),
      name: String(g.name),
      slug: String(g.slug),
      category: g.category_id
        ? (catMap.get(g.category_id as string) ?? null)
        : ((g.category as string | null) ?? null),
      category_id: (g.category_id as string | null) ?? null,
      logo_url: (g.logo_url as string | null) ?? null,
      banner_url: (g.banner_url as string | null) ?? null,
    }))
  },
  ['games-list-v2'],
  { revalidate: 300 }
)
