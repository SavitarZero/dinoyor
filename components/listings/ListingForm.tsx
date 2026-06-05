'use client'
import { useState } from 'react'
import { createListing } from '@/lib/actions/listings'

interface Game { id: string; name: string }

export function ListingForm({ games }: { games: Game[] }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await createListing(formData)
    setLoading(false)
    if (result?.error) setError(result.error)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-900/20 border border-red-700 p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      <div>
        <label className="block text-gray-400 text-sm mb-1">Game</label>
        <select
          name="game_id"
          required
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white"
        >
          <option value="">Select game...</option>
          {games.map(g => (
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
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded-lg bg-accent text-black font-semibold disabled:opacity-50"
      >
        {loading ? 'Listing...' : 'List Item'}
      </button>
    </form>
  )
}
