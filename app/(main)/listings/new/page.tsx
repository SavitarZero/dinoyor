import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createListing } from '@/lib/actions/listings'
import Link from 'next/link'

export default async function NewListingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('kyc_status')
    .eq('id', user.id)
    .single()

  if (profile?.kyc_status !== 'approved') {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">KYC Required</h1>
        <p className="text-gray-400 mb-6">You must verify your identity before listing items.</p>
        <Link href="/profile/kyc" className="px-4 py-2 rounded-lg bg-accent text-black font-semibold">
          Verify Now
        </Link>
      </div>
    )
  }

  const { data: games } = await supabase.from('games').select('id, name').order('name')

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold text-white mb-6">List an Item</h1>
      <form action={createListing} className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-1">Game</label>
          <select
            name="game_id"
            required
            className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white"
          >
            <option value="">Select game...</option>
            {games?.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Item Name</label>
          <input
            name="title"
            type="text"
            required
            placeholder="e.g. AK-47 | Redline"
            className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-gray-400 text-sm mb-1">Price</label>
            <input
              name="price_amount"
              type="number"
              step="0.00000001"
              min="0.000001"
              required
              placeholder="0.00"
              className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Currency</label>
            <select
              name="price_currency"
              required
              className="px-4 py-2 rounded-lg bg-background border border-border text-white"
            >
              <option value="USDT">USDT</option>
              <option value="ETH">ETH</option>
              <option value="BTC">BTC</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Description (optional)</label>
          <textarea
            name="description"
            rows={3}
            placeholder="Describe the item, condition, server..."
            className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent resize-none"
          />
        </div>
        <div>
          <label className="block text-gray-400 text-sm mb-1">Images (at least 1)</label>
          <input
            name="images"
            type="file"
            accept="image/*"
            multiple
            required
            className="w-full text-gray-400 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-surface file:text-white file:cursor-pointer"
          />
        </div>
        <button type="submit" className="w-full py-2 rounded-lg bg-accent text-black font-semibold">
          List Item
        </button>
      </form>
    </div>
  )
}
