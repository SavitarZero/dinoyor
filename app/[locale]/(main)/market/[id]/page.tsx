import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { BuyButton } from '@/components/orders/BuyButton'
import { cancelListing } from '@/lib/actions/listings'
import { ListingImages } from '@/components/listings/ListingImages'
import { LikeButton } from '@/components/listings/LikeButton'
import { CommentsSection } from '@/components/listings/CommentsSection'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: listing }, { data: likes }, { data: comments }, { data: purchase }] = await Promise.all([
    supabase
      .from('listings')
      .select('*, games(name, slug, logo_url, banner_url), seller:profiles!seller_id(username, avatar_url)')
      .eq('id', id)
      .single(),

    supabase
      .from('listing_likes')
      .select('user_id')
      .eq('listing_id', id),

    supabase
      .from('listing_comments')
      .select('id, body, created_at, profiles(username)')
      .eq('listing_id', id)
      .order('created_at', { ascending: false }),

    user
      ? supabase.from('orders').select('id').eq('listing_id', id).eq('buyer_id', user.id).eq('status', 'completed').maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  if (!listing) notFound()

  const isSeller    = user?.id === listing.seller_id
  const seller      = (listing as any).seller
  const likeCount   = likes?.length ?? 0
  const userLiked   = !!(user && likes?.some(l => l.user_id === user.id))
  const hasPurchased = !!purchase

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

      {/* Top section: image + details */}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">

        {/* Images */}
        <ListingImages
          images={listing.images}
          title={listing.title}
          game={(listing as any).games ?? null}
        />

        {/* Details */}
        <div className="flex flex-col gap-4">
          {/* Game tag */}
          {(listing as any).games?.name && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-border text-accent text-xs font-medium w-fit">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
              </svg>
              {(listing as any).games.name}
            </span>
          )}

          <div>
            <h1 className="text-2xl font-bold text-white">{listing.title}</h1>
            {listing.status !== 'active' && (
              <span className="mt-2 inline-block px-2.5 py-1 rounded-lg bg-surface border border-border text-gray-400 text-xs capitalize">
                {listing.status}
              </span>
            )}
          </div>

          {/* Price + Like */}
          <div className="flex items-center gap-4">
            <p className="text-3xl font-bold text-accent">
              {listing.price_currency === 'USD' || listing.price_currency === 'USDT' ? '$' : listing.price_currency === 'ETH' ? 'Ξ' : '₿'}{listing.price_amount}
              {listing.price_currency !== 'USD' && <span className="text-lg text-accent/60 ml-1">{listing.price_currency}</span>}
            </p>
            <div className="flex items-center gap-3">
              <LikeButton
                listingId={listing.id}
                initialLiked={userLiked}
                initialCount={likeCount}
                isAuthenticated={!!user}
              />
              <span className="text-xs text-gray-500">{listing.sold_count ?? 0} sold</span>
              {listing.delivery_time && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {listing.delivery_time}
                </span>
              )}
            </div>
          </div>

          {/* Seller */}
          <Link
            href={seller?.username ? `/seller/${seller.username}` : '#'}
            className="flex items-center gap-3 p-3 rounded-xl bg-surface border border-border hover:border-accent/50 transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-background overflow-hidden shrink-0">
              {seller?.avatar_url ? (
                <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm font-medium">
                  {(seller?.username || '?')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium group-hover:text-accent transition-colors truncate">
                {seller?.username ?? 'Anonymous'}
              </p>
              <p className="text-gray-500 text-xs">View store →</p>
            </div>
          </Link>

          {/* Actions */}
          <div className="space-y-2 mt-auto">
            {!isSeller && user && listing.status === 'active' && (
              <BuyButton listingId={listing.id} />
            )}
            {!user && (
              <div className="p-4 rounded-xl bg-surface border border-border text-center">
                <p className="text-gray-400 text-sm">
                  <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
                  {' '}to purchase this item
                </p>
              </div>
            )}
            {isSeller && listing.status === 'active' && (
              <form action={async () => {
                'use server'
                await cancelListing(id)
              }}>
                <button className="w-full py-2.5 rounded-xl border border-red-700/50 text-red-400 text-sm font-medium hover:bg-red-900/20 transition-colors">
                  Cancel Listing
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {listing.description && (
        <div className="border-t border-border pt-8">
          <h2 className="text-white font-semibold mb-3">Description</h2>
          <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{listing.description}</p>
        </div>
      )}

      {/* Comments */}
      <div className="border-t border-border pt-8">
        <CommentsSection
          listingId={listing.id}
          initialComments={(comments ?? []) as any}
          isAuthenticated={!!user}
          hasPurchased={hasPurchased}
        />
      </div>

    </div>
  )
}
