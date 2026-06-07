import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const revalidate = 60

export async function GET() {
  const supabase = await createClient()

  const [{ data: games, error }, { data: counts }] = await Promise.all([
    supabase
      .from('games')
      .select('id, name, slug, category, logo_url, banner_url')
      .order('category')
      .order('name'),

    supabase
      .from('listings')
      .select('game_id')
      .eq('status', 'active'),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const countMap: Record<string, number> = {}
  for (const row of counts ?? []) {
    countMap[row.game_id] = (countMap[row.game_id] ?? 0) + 1
  }

  const gamesWithStats = (games ?? []).map(g => ({
    ...g,
    listing_count: countMap[g.id] ?? 0,
  }))

  // Group by category
  const byCategory: Record<string, typeof gamesWithStats> = {}
  for (const g of gamesWithStats) {
    const cat = g.category ?? 'Other'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(g)
  }

  return NextResponse.json({ games: gamesWithStats, byCategory })
}
