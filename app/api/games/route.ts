import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getCachedGames } from '@/lib/cache/games'

export const revalidate = 60

export async function GET() {
  const supabase = await createClient()

  const [games, { data: counts }] = await Promise.all([
    getCachedGames(),
    supabase.from('listings').select('game_id').eq('status', 'active'),
  ])

  const countMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    countMap[row.game_id] = (countMap[row.game_id] ?? 0) + 1
  }

  const gamesWithStats = games.map(g => ({
    ...g,
    listing_count: countMap[g.id] ?? 0,
  }))

  const byCategory: Record<string, typeof gamesWithStats> = {}
  for (const g of gamesWithStats) {
    const cat = g.category ?? 'Other'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(g)
  }

  return NextResponse.json({ games: gamesWithStats, byCategory })
}
