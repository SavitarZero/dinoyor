import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import { SearchBar } from '@/components/listings/SearchBar'
import type { ListingWithGame } from '@/lib/types'

interface SearchParams { game?: string; currency?: string; q?: string }

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('id, title, price_amount, price_currency, images, status, seller_id, sold_count, games(name, slug, logo_url), profiles:seller_id(username, avatar_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (params.q) query = query.ilike('title', `%${params.q}%`)
  if (params.currency) query = query.eq('price_currency', params.currency)
  if (params.game) query = query.eq('games.slug', params.game)

  const { data: listings } = await query

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Marketplace</h1>
      <SearchBar />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {(listings as unknown as ListingWithGame[])?.map(l => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
      {!listings?.length && (
        <p className="text-gray-500 text-center py-24">No listings found.</p>
      )}
    </div>
  )
}
