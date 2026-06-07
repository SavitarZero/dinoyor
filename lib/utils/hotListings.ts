import type { SupabaseClient } from '@supabase/supabase-js'

// Returns a Set of listing IDs that are "hot":
// Primary: >= 2 completed orders in the last 30 days
// Fallback: sold_count >= 3 (for mock/early data)
export async function getHotListingIds(supabase: SupabaseClient): Promise<Set<string>> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: recentOrders }, { data: topSellers }] = await Promise.all([
    supabase
      .from('orders')
      .select('listing_id')
      .eq('status', 'completed')
      .gte('created_at', since),

    supabase
      .from('listings')
      .select('id')
      .eq('status', 'active')
      .gte('sold_count', 3),
  ])

  const hotSet = new Set<string>()

  // From recent orders
  const counts: Record<string, number> = {}
  for (const row of recentOrders ?? []) {
    counts[row.listing_id] = (counts[row.listing_id] ?? 0) + 1
  }
  for (const [id, count] of Object.entries(counts)) {
    if (count >= 2) hotSet.add(id)
  }

  // Fallback: high sold_count
  for (const l of topSellers ?? []) {
    hotSet.add(l.id)
  }

  return hotSet
}
