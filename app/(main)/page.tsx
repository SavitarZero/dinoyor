import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import type { ListingWithGame } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, price_amount, price_currency, images, status, seller_id, games(name, slug, logo_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div>
      {/* Hero */}
      <section className="py-28 text-center px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.07) 0%, transparent 70%)',
          }}
        />
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-5 relative">
          Trade Game Items.<br />
          <span className="text-accent">Secured by Escrow.</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto mb-10 text-lg relative">
          Buy and sell in-game items with crypto — every transaction protected by Dinoyor's
          centralized escrow wallet for SEA gamers.
        </p>
        <div className="flex justify-center gap-4 relative">
          <Link
            href="/listings"
            className="px-6 py-3 rounded-lg bg-accent text-black font-semibold hover:opacity-90"
          >
            Browse Marketplace
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg border border-border text-white hover:border-accent transition-colors"
          >
            Start Selling
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-xl font-bold text-white mb-8 text-center">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Find an item', desc: 'Browse listings from verified sellers across SEA.' },
            { step: '02', title: 'Pay to escrow', desc: 'Send crypto to our secure escrow wallet. Funds are held safely.' },
            { step: '03', title: 'Confirm & complete', desc: 'Receive your item, confirm, and the seller gets paid.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="rounded-xl border border-border bg-surface p-6">
              <p className="text-accent font-bold text-sm mb-2">{step}</p>
              <p className="text-white font-semibold">{title}</p>
              <p className="text-gray-400 text-sm mt-1">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent listings */}
      {listings && listings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Recent Listings</h2>
            <Link href="/listings" className="text-accent text-sm hover:underline">See all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(listings as unknown as ListingWithGame[]).map(l => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
