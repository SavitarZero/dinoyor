import Image from 'next/image'
import Link from 'next/link'
import type { ListingWithGame } from '@/lib/types'

export function ListingCard({ listing }: { listing: ListingWithGame }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="block rounded-xl border border-border bg-surface hover:border-accent transition-colors"
    >
      <div className="relative h-48 rounded-t-xl overflow-hidden bg-background">
        {listing.images[0] ? (
          <Image
            src={listing.images[0]}
            alt={listing.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-sm">No image</div>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-1">{listing.games?.name}</p>
        <h3 className="text-white font-medium truncate">{listing.title}</h3>
        <p className="text-accent font-semibold mt-2">
          {listing.price_amount} {listing.price_currency}
        </p>
      </div>
    </Link>
  )
}
