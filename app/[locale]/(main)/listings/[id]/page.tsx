import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { BuyButton } from '@/components/orders/BuyButton'
import { cancelListing } from '@/lib/actions/listings'

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('*, games(name, slug), seller:profiles!seller_id(username)')
    .eq('id', id)
    .single()

  if (!listing) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isSeller = user?.id === listing.seller_id

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-2">
          {listing.images.length > 0 ? (
            listing.images.map((url: string, i: number) => (
              <div key={i} className="relative h-64 rounded-xl overflow-hidden bg-surface">
                <Image src={url} alt={listing.title} fill className="object-cover" />
              </div>
            ))
          ) : (
            <div className="h-64 rounded-xl bg-surface flex items-center justify-center text-gray-600">
              No images
            </div>
          )}
        </div>
        <div>
          <p className="text-gray-500 text-sm">{(listing as any).games?.name}</p>
          <h1 className="text-2xl font-bold text-white mt-1">{listing.title}</h1>
          <p className="text-accent text-2xl font-semibold mt-4">
            {listing.price_amount} {listing.price_currency}
          </p>
          {listing.description && (
            <p className="text-gray-400 mt-4 text-sm leading-relaxed">{listing.description}</p>
          )}
          <p className="text-gray-500 text-sm mt-4">
            Seller: {(listing as any).seller?.username ?? 'Anonymous'}
          </p>
          <div className="mt-6 space-y-2">
            {!isSeller && user && listing.status === 'active' && (
              <BuyButton listingId={listing.id} />
            )}
            {!user && (
              <p className="text-gray-500 text-sm">
                <a href="/login" className="text-accent">Sign in</a> to purchase
              </p>
            )}
            {isSeller && listing.status === 'active' && (
              <form action={async () => {
                'use server'
                await cancelListing(id)
              }}>
                <button className="w-full py-2 rounded-lg border border-red-700 text-red-400 font-semibold hover:bg-red-900/20">
                  Cancel Listing
                </button>
              </form>
            )}
          </div>
          {listing.status !== 'active' && (
            <div className="mt-4 px-3 py-2 rounded-lg bg-surface border border-border">
              <p className="text-gray-400 text-sm capitalize">Status: {listing.status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
