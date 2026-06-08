import { createClient } from '@/lib/supabase/server'
import { getCachedGames } from '@/lib/cache/games'
import { HomeSections } from '@/components/home/HomeSections'
import { getHotListingIds } from '@/lib/utils/hotListings'
import type { ListingWithGame, GameWithStats } from '@/lib/types/index'

export default async function HomePage() {
  const supabase = await createClient()

  const [gamesRaw, { data: listingCounts, error: e2 }, { data: listings, error: e3 }, hotIds] = await Promise.all([
    getCachedGames(),

    supabase.from('listings').select('game_id').eq('status', 'active'),

    supabase
      .from('listings')
      .select('id, title, price_amount, price_currency, images, status, seller_id, sold_count, games(name, slug, category, logo_url, banner_url), profiles:seller_id(username, avatar_url)')
      .eq('status', 'active')
      .order('sold_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(64),

    getHotListingIds(supabase),
  ])

  if (e2) console.error('[home] counts:', e2.message)
  if (e3) console.error('[home] listings:', e3.message)

  const countMap: Record<string, number> = {}
  for (const row of listingCounts ?? []) {
    countMap[row.game_id] = (countMap[row.game_id] ?? 0) + 1
  }

  const games: GameWithStats[] = gamesRaw.map(g => ({
    ...g,
    category: g.category ?? null,
    banner_url: g.banner_url ?? null,
    listing_count: countMap[g.id] ?? 0,
  }))

  const byCategory: Record<string, GameWithStats[]> = {}
  for (const g of games) {
    const cat = g.category ?? 'Other'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(g)
  }

  return (
    <HomeSections
      games={games}
      byCategory={byCategory}
      listings={(listings ?? []) as unknown as ListingWithGame[]}
      hotIds={hotIds}
    />
  )
}
