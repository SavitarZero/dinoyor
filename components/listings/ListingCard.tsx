'use client'
import Link from 'next/link'
import type { ListingWithGame } from '@/lib/types/index'
import { GameBanner } from '@/components/games/GameImage'

function formatPrice(amount: number, currency: string) {
  if (currency === 'ETH') return `Ξ${amount}`
  if (currency === 'BTC') return `₿${amount}`
  return `${amount} coin`
}

function ListingImage({ listing }: { readonly listing: ListingWithGame }) {
  if (listing.images[0]) {
    return (
      <img
        src={listing.images[0]}
        alt={listing.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e) => { e.currentTarget.style.display = 'none' }}
      />
    )
  }
  if (listing.games) {
    return <GameBanner src={null} slug={listing.games.slug} name={listing.games.name} className="w-full h-full" />
  }
  return (
    <div className="w-full h-full flex items-center justify-center text-gray-700">
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  )
}

export function ListingCard({ listing, isHot }: Readonly<{ listing: ListingWithGame; isHot?: boolean }>) {
  return (
    <Link
      href={`/market/${listing.id}`}
      className="group flex flex-col bg-surface rounded overflow-hidden border border-border hover:border-accent/60 hover:bg-surface-2 transition-all duration-150"
    >
      {/* Image — landscape 16:9 */}
      <div className="relative aspect-video bg-background overflow-hidden">
        <ListingImage listing={listing} />

        {isHot && (
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-orange-500/90 text-white text-[10px] font-bold backdrop-blur-sm">
              🔥 Hot
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-white text-xs font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors min-h-8">
          {listing.title}
        </p>
        <div className="flex items-center justify-between gap-2 mt-auto">
          <span className="text-sm font-bold text-white">
            {formatPrice(listing.price_amount, listing.price_currency)}
          </span>
          {listing.profiles?.username && (
            <div className="flex items-center gap-1.5 min-w-0">
              {listing.profiles.avatar_url ? (
                <img
                  src={listing.profiles.avatar_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-4 h-4 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[8px] font-bold shrink-0">
                  {listing.profiles.username[0].toUpperCase()}
                </span>
              )}
              <span className="text-[10px] text-gray-600 truncate max-w-14">@{listing.profiles.username}</span>
            </div>
          )}
        </div>
        <p className="text-[10px] text-gray-700">{listing.sold_count ?? 0} sold</p>
      </div>
    </Link>
  )
}
