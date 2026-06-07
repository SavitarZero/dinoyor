'use client'
import Link from 'next/link'
import type { ListingWithGame } from '@/lib/types/index'
import { GameBanner } from '@/components/games/GameImage'

const CURRENCY_SYMBOL: Record<string, string> = {
  USD:  '$',
  USDT: '$',
  ETH:  'Ξ',
  BTC:  '₿',
}

export function ListingCard({ listing, rank }: { listing: ListingWithGame; rank?: number }) {
  const symbol = CURRENCY_SYMBOL[listing.price_currency] ?? listing.price_currency
  return (
    <Link
      href={`/market/${listing.id}`}
      className="group flex flex-col bg-surface rounded-xl overflow-hidden border border-border hover:border-accent/50 hover:shadow-[0_0_0_1px_rgba(0,229,255,0.12)] transition-all duration-200"
    >
      {/* Image — landscape 16:9 */}
      <div className="relative aspect-video bg-background overflow-hidden">
        {listing.images[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
        ) : listing.games ? (
          <GameBanner
            src={null}
            slug={listing.games.slug}
            name={listing.games.name}
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {rank !== undefined && rank < 3 && (
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
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold text-white">
              {symbol}{listing.price_amount}
            </span>
            <span className="text-[10px] text-gray-600">· {listing.sold_count ?? 0} sold</span>
          </div>
          {listing.profiles?.username && (
            <span className="text-[10px] text-gray-700 truncate max-w-16">@{listing.profiles.username}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
