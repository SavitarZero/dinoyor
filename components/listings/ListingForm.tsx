'use client'
import { useState, useRef } from 'react'
import { createListing } from '@/lib/actions/listings'

interface Game { id: string; name: string }

export function ListingForm({ games }: { games: Game[] }) {
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [previews, setPreviews] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    const urls = Array.from(files).map(f => URL.createObjectURL(f))
    setPreviews(urls)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await createListing(new FormData(e.currentTarget))
    setLoading(false)
    if (result?.error) setError(result.error)
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl bg-background border border-border text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent transition-colors'
  const labelCls = 'block text-sm font-medium text-gray-400 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-red-900/20 border border-red-700/50 p-4 flex gap-3 items-start">
          <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Game */}
      <div>
        <label className={labelCls}>Game</label>
        <select name="game_id" required className={inputCls + ' cursor-pointer'}>
          <option value="">Select a game...</option>
          {games.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className={labelCls}>Item Name</label>
        <input
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder="e.g. AK-47 | Redline (Field-Tested)"
          className={inputCls}
        />
      </div>

      {/* Price */}
      <div>
        <label className={labelCls}>Price (USD)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">$</span>
          <input
            name="price_amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0.00"
            className={inputCls + ' pl-8'}
          />
        </div>
        <input type="hidden" name="price_currency" value="USD" />
      </div>

      {/* Delivery time */}
      <div>
        <label className={labelCls}>Estimated Delivery Time</label>
        <select name="delivery_time" className={inputCls + ' cursor-pointer'}>
          <option value="">Not specified</option>
          <option value="Instant">Instant</option>
          <option value="< 1 hour">&lt; 1 hour</option>
          <option value="1–3 hours">1–3 hours</option>
          <option value="Same day">Same day</option>
          <option value="1–2 days">1–2 days</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className={labelCls}>
          Description <span className="text-gray-600 font-normal">(optional)</span>
        </label>
        <textarea
          name="description"
          rows={3}
          placeholder="Describe the item — condition, server, any extras..."
          className={inputCls + ' resize-none'}
        />
      </div>

      {/* Images */}
      <div>
        <label className={labelCls}>
          Photos <span className="text-red-400">*</span>
        </label>
        <input
          ref={fileRef}
          name="images"
          type="file"
          accept="image/*"
          multiple
          required
          onChange={e => handleFiles(e.target.files)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-border hover:border-accent transition-colors p-8 text-center group"
        >
          <svg className="w-8 h-8 text-gray-600 group-hover:text-accent transition-colors mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-sm text-gray-400 group-hover:text-white transition-colors">
            Click to upload photos
          </p>
          <p className="text-xs text-gray-600 mt-1">JPG, PNG, WEBP · Max 5 files</p>
        </button>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-background">
                <img src={src} alt="" className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-xs">Cover</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border pt-4">
        <div className="rounded-xl bg-surface border border-border p-3 flex gap-2 mb-4">
          <svg className="w-4 h-4 text-accent shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          <p className="text-gray-400 text-xs">
            A 5% platform fee applies to each sale. Payment is held in escrow until the buyer confirms receipt.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Listing...
            </>
          ) : 'Publish Listing'}
        </button>
      </div>
    </form>
  )
}
