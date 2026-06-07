'use client'
import { useState, useRef } from 'react'
import imageCompression from 'browser-image-compression'
import { createListing } from '@/lib/actions/listings'

interface Game { id: string; name: string }

const COVER_MAX_MB       = 2
const ADDITIONAL_MAX_MB  = 3
const ADDITIONAL_MAX_COUNT = 5

async function compressImage(file: File, maxWidthOrHeight: number, maxSizeMB: number): Promise<File> {
  return imageCompression(file, {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.85,
  })
}

function syncFilesToInput(ref: React.RefObject<HTMLInputElement | null>, files: File[]) {
  if (!ref.current) return
  const dt = new DataTransfer()
  files.forEach(f => dt.items.add(f))
  ref.current.files = dt.files
}

export function ListingForm({ games }: { games: Game[] }) {
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const [coverPreview, setCoverPreview]   = useState<string | null>(null)
  const [coverError, setCoverError]       = useState('')
  const [coverCompressing, setCoverCompressing] = useState(false)

  const [additionalPreviews, setAdditionalPreviews] = useState<{ url: string; file: File }[]>([])
  const [additionalError, setAdditionalError]       = useState('')
  const [additionalCompressing, setAdditionalCompressing] = useState(false)

  const coverRef      = useRef<HTMLInputElement>(null)
  const additionalRef = useRef<HTMLInputElement>(null)

  async function handleCover(files: FileList | null) {
    setCoverError('')
    if (!files || files.length === 0) return
    const file = files[0]

    if (file.size > COVER_MAX_MB * 1024 * 1024) {
      setCoverError(`Cover image must be under ${COVER_MAX_MB} MB`)
      if (coverRef.current) coverRef.current.value = ''
      return
    }

    setCoverCompressing(true)
    try {
      const compressed = await compressImage(file, 800, 0.4)
      const compressedFile = new File([compressed], compressed.name, { type: compressed.type })
      syncFilesToInput(coverRef, [compressedFile])
      setCoverPreview(URL.createObjectURL(compressedFile))
    } catch {
      setCoverError('Failed to process image, please try again')
    } finally {
      setCoverCompressing(false)
    }
  }

  async function handleAdditional(files: FileList | null) {
    setAdditionalError('')
    if (!files || files.length === 0) return
    const incoming = Array.from(files)

    if (additionalPreviews.length + incoming.length > ADDITIONAL_MAX_COUNT) {
      setAdditionalError(`Maximum ${ADDITIONAL_MAX_COUNT} additional images`)
      if (additionalRef.current) additionalRef.current.value = ''
      return
    }
    const oversized = incoming.find(f => f.size > ADDITIONAL_MAX_MB * 1024 * 1024)
    if (oversized) {
      setAdditionalError(`"${oversized.name}" exceeds ${ADDITIONAL_MAX_MB} MB`)
      if (additionalRef.current) additionalRef.current.value = ''
      return
    }

    setAdditionalCompressing(true)
    try {
      const compressed = await Promise.all(
        incoming.map(f => compressImage(f, 1200, 0.7).then(c => new File([c], c.name, { type: c.type })))
      )
      setAdditionalPreviews(prev => {
        const updated = [...prev, ...compressed.map(f => ({ url: URL.createObjectURL(f), file: f }))]
        syncFilesToInput(additionalRef, updated.map(p => p.file))
        return updated
      })
    } catch {
      setAdditionalError('Failed to process images, please try again')
    } finally {
      setAdditionalCompressing(false)
    }
  }

  function removeAdditional(index: number) {
    setAdditionalPreviews(prev => {
      const updated = prev.filter((_, i) => i !== index)
      syncFilesToInput(additionalRef, updated.map(p => p.file))
      return updated
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!coverPreview) { setError('Cover image is required'); return }
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

      {/* ── Cover image ── */}
      <div>
        <label className={labelCls}>
          Cover Image <span className="text-red-400">*</span>
          <span className="text-gray-600 font-normal ml-1">· shown on listing cards</span>
        </label>
        <input
          ref={coverRef}
          name="cover"
          type="file"
          accept="image/*"
          onChange={e => handleCover(e.target.files)}
          className="hidden"
        />

        {coverCompressing ? (
          <div className="w-40 h-40 rounded-xl border border-border bg-background flex flex-col items-center justify-center gap-2">
            <svg className="w-5 h-5 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-gray-600 text-xs">Compressing…</p>
          </div>
        ) : coverPreview ? (
          <div className="relative w-40 h-40 rounded-xl overflow-hidden bg-background border border-border group cursor-pointer" onClick={() => coverRef.current?.click()}>
            <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-xs font-medium">Change</span>
            </div>
            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-accent text-black text-xs font-semibold">Cover</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => coverRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-border hover:border-accent transition-colors p-8 text-center group"
          >
            <svg className="w-8 h-8 text-gray-600 group-hover:text-accent transition-colors mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-sm text-gray-400 group-hover:text-white transition-colors">Upload cover image</p>
            <p className="text-xs text-gray-600 mt-1">JPG, PNG, WEBP · auto-compressed to ~400 KB</p>
          </button>
        )}
        {coverError && <p className="text-red-400 text-xs mt-1.5">{coverError}</p>}
      </div>

      {/* ── Additional images ── */}
      <div>
        <label className={labelCls}>
          Additional Images <span className="text-gray-600 font-normal">(optional · up to {ADDITIONAL_MAX_COUNT})</span>
        </label>
        <input
          ref={additionalRef}
          name="additional"
          type="file"
          accept="image/*"
          multiple
          onChange={e => handleAdditional(e.target.files)}
          className="hidden"
        />

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {additionalPreviews.map((img, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-background border border-border group">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAdditional(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {additionalCompressing && (
            <div className="aspect-square rounded-xl border border-border bg-background flex flex-col items-center justify-center gap-1">
              <svg className="w-4 h-4 text-accent animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <span className="text-xs text-gray-600">…</span>
            </div>
          )}

          {!additionalCompressing && additionalPreviews.length < ADDITIONAL_MAX_COUNT && (
            <button
              type="button"
              onClick={() => additionalRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-accent transition-colors flex flex-col items-center justify-center gap-1 group"
            >
              <svg className="w-5 h-5 text-gray-600 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
                {additionalPreviews.length === 0 ? 'Add' : `${additionalPreviews.length}/${ADDITIONAL_MAX_COUNT}`}
              </span>
            </button>
          )}
        </div>
        {additionalError && <p className="text-red-400 text-xs mt-1.5">{additionalError}</p>}
      </div>

      {/* Info + Submit */}
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
          disabled={loading || coverCompressing || additionalCompressing}
          className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Publishing…
            </>
          ) : 'Publish Listing'}
        </button>
      </div>
    </form>
  )
}
