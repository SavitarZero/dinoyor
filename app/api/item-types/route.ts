import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const revalidate = 60

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const gameId = searchParams.get('game_id')

  const supabase = await createClient()

  // Fetch types for this specific game AND generic types (game_id IS NULL)
  const { data, error } = await supabase
    .from('item_types')
    .select('id, name, slug, sort_order, game_id')
    .or(gameId ? `game_id.eq.${gameId},game_id.is.null` : 'game_id.is.null')
    .order('sort_order')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ types: data ?? [] })
}
