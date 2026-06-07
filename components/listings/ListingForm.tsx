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
  const [price, setPrice] = useState('')

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

  const priceNum = parseFloat(price) || 0
  const fee = priceNum * 0.05
  const sellerReceives = priceNum - fee

  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-background border border-border text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent transition-colors'
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5'

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <div>
              <label className={labelCls}>Game</label>
              <select name="game_id" required className={inputCls}>
                <option value="">Select a game...</option>
                {games.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Item name</label>
              <input
                name="title"
                type="text"
                required
                maxLength={100}
                placeholder="e.g. AK-47 | Redline (Field-Tested)"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Description <span className="text-gray-600">(optional)</span></label>
              <textarea
                name="description"
                rows={4}
                placeholder="Condition, server, extras..."
                className={inputCls + ' resize-none'}
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <div>
              <label className={labelCls}>Cover image</label>
              <input
                ref={coverRef}
                name="cover"
                type="file"
                accept="image/*"
                onChange={e => handleCover(e.target.files)}
                className="hidden"
              />
              {coverCompressing ? (
                <div className="aspect-[4/3] rounded-xl border border-border bg-background flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Compressing…</span>
                </div>
              ) : coverPreview ? (
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-background border border-border group cursor-pointer" onClick={() => coverRef.current?.click()}>
                  <img src={coverPreview} alt="cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs">Change</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverRef.current?.click()}
                  className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border hover:border-accent transition-colors flex flex-col items-center justify-center"
                >
                  <p className="text-sm text-gray-400">Upload cover image</p>
                  <p className="text-xs text-gray-600 mt-0.5">Auto-compressed · max {COVER_MAX_MB} MB</p>
                </button>
              )}
              {coverError && <p className="text-red-400 text-xs mt-1">{coverError}</p>}
            </div>

            <div>
              <label className={labelCls}>Additional images <span className="text-gray-600">(up to {ADDITIONAL_MAX_COUNT})</span></label>
              <input
                ref={additionalRef}
                name="additional"
                type="file"
                accept="image/*"
                multiple
                onChange={e => handleAdditional(e.target.files)}
                className="hidden"
              />
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {additionalPreviews.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-background border border-border group">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAdditional(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {additionalCompressing && (
                  <div className="aspect-square rounded-xl border border-border bg-background flex items-center justify-center">
                    <span className="text-xs text-gray-600">…</span>
                  </div>
                )}
                {!additionalCompressing && additionalPreviews.length < ADDITIONAL_MAX_COUNT && (
                  <button
                    type="button"
                    onClick={() => additionalRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-accent transition-colors flex items-center justify-center"
                  >
                    <span className="text-gray-500 text-lg">+</span>
                  </button>
                )}
              </div>
              {additionalError && <p className="text-red-400 text-xs mt-1">{additionalError}</p>}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Price (USDT)</label>
                <input
                  name="price_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className={inputCls}
                />
                <input type="hidden" name="price_currency" value="USD" />
              </div>
              <div>
                <label className={labelCls}>Delivery time</label>
                <select name="delivery_time" className={inputCls}>
                  <option value="">Not specified</option>
                  <option value="Instant">Instant</option>
                  <option value="< 1 hour">&lt; 1 hour</option>
                  <option value="1–3 hours">1–3 hours</option>
                  <option value="Same day">Same day</option>
                  <option value="1–2 days">1–2 days</option>
                </select>
              </div>
            </div>
          </div>

        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-4">

            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="aspect-[4/3] bg-background">
                {coverPreview ? (
                  <img src={coverPreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs">Cover preview</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <p className="text-xs font-medium text-gray-400">Pricing summary</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Listing price</span>
                  <span className="text-white">{priceNum > 0 ? `$${priceNum.toFixed(2)}` : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Platform fee (5%)</span>
                  <span className="text-gray-400">{priceNum > 0 ? `-$${fee.toFixed(2)}` : '—'}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm">
                  <span className="text-white font-medium">You receive</span>
                  <span className="text-accent font-bold">{priceNum > 0 ? `$${sellerReceives.toFixed(2)}` : '—'}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || coverCompressing || additionalCompressing}
              className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {loading ? 'Publishing…' : 'Publish listing'}
            </button>
            <p className="text-gray-600 text-xs text-center">Funds held in escrow until buyer confirms receipt</p>

          </div>
        </div>
      </div>
    </form>
  )
}
