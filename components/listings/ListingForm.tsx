'use client'
import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { createListing } from '@/lib/actions/listings'
import Link from 'next/link'

interface Game { id: string; name: string }
interface ItemType { id: string; name: string; slug: string }

function KycSellBanner({ kycStatus }: Readonly<{ kycStatus: string | null }>) {
  return (
    <div className="rounded border border-border bg-surface p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div>
          <p className="text-white text-sm font-semibold">Verify to sell</p>
          <p className="text-gray-400 text-xs mt-0.5">
            {kycStatus === 'pending'
              ? 'Your verification is being reviewed — usually 1–2 business days.'
              : 'Complete identity verification before publishing listings.'}
          </p>
        </div>
      </div>
      {kycStatus !== 'pending' && (
        <Link
          href="/profile/kyc"
          className="w-full py-2.5 rounded bg-accent text-black text-sm font-bold text-center hover:opacity-90 transition-opacity flex items-center justify-center"
        >
          Verify identity
        </Link>
      )}
    </div>
  )
}

const COVER_MAX_MB       = 2
const ADDITIONAL_MAX_MB  = 3
const ADDITIONAL_MAX_COUNT = 5

async function compressImage(file: File, maxWidthOrHeight: number, maxSizeMB: number): Promise<File> {
  const { default: imageCompression } = await import('browser-image-compression')
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

async function processCover(file: File, ref: React.RefObject<HTMLInputElement | null>): Promise<{ url: string } | { error: string }> {
  if (file.size > COVER_MAX_MB * 1024 * 1024) {
    if (ref.current) ref.current.value = ''
    return { error: `Cover image must be under ${COVER_MAX_MB} MB` }
  }
  const compressed = await compressImage(file, 800, 0.4)
  const f = new File([compressed], compressed.name, { type: compressed.type })
  syncFilesToInput(ref, [f])
  return { url: URL.createObjectURL(f) }
}

async function processAdditional(
  incoming: File[],
  currentCount: number,
  ref: React.RefObject<HTMLInputElement | null>,
): Promise<{ files: File[] } | { error: string }> {
  if (currentCount + incoming.length > ADDITIONAL_MAX_COUNT) {
    if (ref.current) ref.current.value = ''
    return { error: `Maximum ${ADDITIONAL_MAX_COUNT} additional images` }
  }
  const oversized = incoming.find(f => f.size > ADDITIONAL_MAX_MB * 1024 * 1024)
  if (oversized) {
    if (ref.current) ref.current.value = ''
    return { error: `"${oversized.name}" exceeds ${ADDITIONAL_MAX_MB} MB` }
  }
  const compressed = await Promise.all(
    incoming.map(f => compressImage(f, 1200, 0.7).then(c => new File([c], c.name, { type: c.type })))
  )
  return { files: compressed }
}

export function ListingForm({ games, kycStatus, feePct, flatFee }: Readonly<{ games: Game[]; kycStatus: string | null; feePct?: number; flatFee?: number }>) {
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [price, setPrice] = useState('')

  const [gameSearch, setGameSearch] = useState('')
  const [gameOpen, setGameOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const gameRef = useRef<HTMLDivElement>(null)

  const [coverPreview, setCoverPreview]   = useState<string | null>(null)
  const [coverError, setCoverError]       = useState('')
  const [coverCompressing, setCoverCompressing] = useState(false)

  const [additionalPreviews, setAdditionalPreviews] = useState<{ url: string; file: File }[]>([])
  const [additionalError, setAdditionalError]       = useState('')
  const [additionalCompressing, setAdditionalCompressing] = useState(false)

  const coverRef      = useRef<HTMLInputElement>(null)
  const additionalRef = useRef<HTMLInputElement>(null)

  const filteredGames = games.filter(g =>
    g.name.toLowerCase().includes(gameSearch.toLowerCase())
  )

  const [itemTypes, setItemTypes] = useState<ItemType[]>([])
  const [selectedItemType, setSelectedItemType] = useState<ItemType | null>(null)
  const [itemTypeOpen, setItemTypeOpen] = useState(false)
  const itemTypeRef = useRef<HTMLDivElement>(null)

  const [deliveryOpen, setDeliveryOpen] = useState(false)
  const [selectedDelivery, setSelectedDelivery] = useState('')
  const deliveryRef = useRef<HTMLDivElement>(null)

  const deliveryOptions = [
    { value: '30min', label: 'Within 30 minutes' },
    { value: '1-3h', label: 'Within 1–3 hours' },
    { value: '3-5h', label: 'Within 3–5 hours' },
    { value: '6-12h', label: 'Within 6–12 hours' },
    { value: '1day', label: 'Within 1 day' },
  ]

  // Fetch item types whenever selected game changes
  useEffect(() => {
    const url = selectedGame
      ? `/api/item-types?game_id=${selectedGame.id}`
      : '/api/item-types'
    fetch(url)
      .then(r => r.json())
      .then(d => { setItemTypes(d.types ?? []); setSelectedItemType(null) })
      .catch(() => { setItemTypes([]); setSelectedItemType(null) })
  }, [selectedGame])

  useEffect(() => {
    if (!gameOpen && !deliveryOpen && !itemTypeOpen) return
    function outside(ref: React.RefObject<HTMLDivElement | null>, e: MouseEvent) {
      return !ref.current?.contains(e.target as Node)
    }
    function handleClick(e: MouseEvent) {
      if (gameOpen && outside(gameRef, e)) setGameOpen(false)
      if (deliveryOpen && outside(deliveryRef, e)) setDeliveryOpen(false)
      if (itemTypeOpen && outside(itemTypeRef, e)) setItemTypeOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [gameOpen, deliveryOpen, itemTypeOpen])

  async function handleCover(files: FileList | null) {
    setCoverError('')
    if (!files || files.length === 0) return
    setCoverCompressing(true)
    try {
      const result = await processCover(files[0], coverRef)
      if ('error' in result) { setCoverError(result.error); return }
      setCoverPreview(result.url)
    } catch {
      setCoverError('Failed to process image, please try again')
    } finally {
      setCoverCompressing(false)
    }
  }

  async function handleAdditional(files: FileList | null) {
    setAdditionalError('')
    if (!files || files.length === 0) return
    setAdditionalCompressing(true)
    try {
      const result = await processAdditional(Array.from(files), additionalPreviews.length, additionalRef)
      if ('error' in result) { setAdditionalError(result.error); return }
      setAdditionalPreviews(prev => {
        const updated = [...prev, ...result.files.map(f => ({ url: URL.createObjectURL(f), file: f }))]
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

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!coverPreview) { setError('Cover image is required'); return }
    const p = parseFloat(price) || 0
    if (p < MIN_PRICE) { setError(`Minimum price is ${MIN_PRICE} coin`); return }
    setLoading(true)
    setError('')
    const result = await createListing(new FormData(e.currentTarget))
    setLoading(false)
    if (result?.error) setError(result.error)
  }

  const MIN_PRICE = 10
  const priceNum = parseFloat(price) || 0
  const resolvedFeePct = feePct ?? 5
  const resolvedFlatFee = flatFee ?? 1
  const percentFeeAmt = priceNum * resolvedFeePct / 100
  const youReceive = Math.max(0, priceNum - percentFeeAmt - resolvedFlatFee)
  const fee = percentFeeAmt

  const inputCls = 'w-full px-3 py-2.5 rounded bg-background border border-border text-white placeholder-gray-600 text-sm focus:outline-none focus:border-focus-border transition-colors'
  const labelCls = 'block text-xs font-medium text-gray-400 mb-1.5'

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">

          <div className="rounded border border-border bg-surface p-5 space-y-4">
            <div>
              <label className={labelCls}>Game</label>
              <input type="hidden" name="game_id" value={selectedGame?.id ?? ''} />
              <div className="relative" ref={gameRef}>
                <div
                  className={`${inputCls} flex items-center cursor-text`}
                  onClick={() => setGameOpen(true)}
                >
                  <input
                    type="text"
                    value={gameOpen ? gameSearch : (selectedGame?.name ?? '')}
                    onChange={e => { setGameSearch(e.target.value); setGameOpen(true) }}
                    onFocus={() => setGameOpen(true)}
                    placeholder="Search or select a game..."
                    className="flex-1 bg-transparent outline-none placeholder-gray-600 text-sm text-white"
                  />
                  <svg
                    className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${gameOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {gameOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded border border-border bg-surface shadow-xl max-h-52 overflow-y-auto">
                    {filteredGames.length === 0 ? (
                      <p className="px-3 py-2.5 text-gray-500 text-sm">No games found</p>
                    ) : filteredGames.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => { setSelectedGame(g); setGameSearch(''); setGameOpen(false) }}
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 transition-colors ${
                          selectedGame?.id === g.id ? 'text-accent' : 'text-white'
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className={labelCls}>Item type</label>
              <input type="hidden" name="item_type_id" value={selectedItemType?.id ?? ''} />
              <div className="relative" ref={itemTypeRef}>
                <button
                  type="button"
                  onClick={() => setItemTypeOpen(v => !v)}
                  className={`${inputCls} flex items-center justify-between text-left`}
                >
                  <span className={selectedItemType ? 'text-white' : 'text-gray-600'}>
                    {selectedItemType?.name ?? 'Select type…'}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${itemTypeOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {itemTypeOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded border border-border bg-surface shadow-xl max-h-52 overflow-y-auto">
                    {itemTypes.length === 0 ? (
                      <p className="px-3 py-2.5 text-gray-500 text-sm">No types available</p>
                    ) : itemTypes.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => { setSelectedItemType(t); setItemTypeOpen(false) }}
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 transition-colors ${
                          selectedItemType?.id === t.id ? 'text-accent' : 'text-white'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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

          <div className="rounded border border-border bg-surface p-5 space-y-4">
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
                <div className="aspect-[4/3] rounded border border-border bg-background flex items-center justify-center">
                  <span className="text-gray-500 text-xs">Compressing…</span>
                </div>
              ) : coverPreview ? (
                <div className="relative aspect-[4/3] rounded overflow-hidden bg-background border border-border group cursor-pointer" onClick={() => coverRef.current?.click()}>
                  <Image src={coverPreview} alt="cover" fill unoptimized className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs">Change</span>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => coverRef.current?.click()}
                  className="w-full aspect-[4/3] rounded border-2 border-dashed border-border hover:border-gray-500 transition-colors flex flex-col items-center justify-center gap-2"
                >
                  <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm text-gray-300">Click to upload cover image</p>
                    <p className="text-xs text-gray-600 mt-0.5">JPG, PNG or WebP · max {COVER_MAX_MB} MB</p>
                  </div>
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
                  <div key={i} className="relative aspect-square rounded overflow-hidden bg-background border border-border group">
                    <Image src={img.url} alt="" fill unoptimized className="object-cover" />
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
                  <div className="aspect-square rounded border border-border bg-background flex items-center justify-center">
                    <span className="text-xs text-gray-600">…</span>
                  </div>
                )}
                {!additionalCompressing && additionalPreviews.length < ADDITIONAL_MAX_COUNT && (
                  <button
                    type="button"
                    onClick={() => additionalRef.current?.click()}
                    className="aspect-square rounded border-2 border-dashed border-border hover:border-gray-500 transition-colors flex items-center justify-center"
                  >
                    <span className="text-gray-500 text-lg">+</span>
                  </button>
                )}
              </div>
              {additionalError && <p className="text-red-400 text-xs mt-1">{additionalError}</p>}
            </div>
          </div>

          <div className="rounded border border-border bg-surface p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-baseline gap-2 mb-1.5">
                  <label className="text-xs font-medium text-gray-400">Price (coin)</label>
                  <span className="text-gray-600 text-[10px]">min {MIN_PRICE} coin</span>
                </div>
                <div className="relative">
                  <input
                    name="price_amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className={inputCls + ' pr-9'}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
                    <button type="button" onClick={() => setPrice(String((parseFloat(price) || 0) + 1))} className="text-gray-500 hover:text-white transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button type="button" onClick={() => setPrice(String(Math.max(0, (parseFloat(price) || 0) - 1)))} className="text-gray-500 hover:text-white transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                </div>
                {/* Fee breakdown */}
                {priceNum > 0 && (
                  <div className="mt-2 rounded bg-background border border-border p-4 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Price</span>
                      <span>{priceNum.toFixed(2)} coin</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs">
                      <span>Platform fee ({resolvedFeePct}% + {resolvedFlatFee} coin)</span>
                      <span>−{(percentFeeAmt + resolvedFlatFee).toFixed(2)} coin</span>
                    </div>
                    <div className="border-t border-border pt-1.5 flex justify-between font-semibold">
                      <span className="text-white">You receive</span>
                      <span className="text-accent-gold">{youReceive.toFixed(2)} coin</span>
                    </div>
                  </div>
                )}
                <input type="hidden" name="price_currency" value="USD" />
              </div>
              <div>
                <label className={labelCls}>Delivery time</label>
                <input type="hidden" name="delivery_time" value={selectedDelivery} />
                <div className="relative" ref={deliveryRef}>
                  <button
                    type="button"
                    onClick={() => setDeliveryOpen(v => !v)}
                    className={`${inputCls} flex items-center justify-between text-left`}
                  >
                    <span className={selectedDelivery ? 'text-white' : 'text-gray-600'}>
                      {selectedDelivery || 'Not specified'}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${deliveryOpen ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {deliveryOpen && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 rounded border border-border bg-surface shadow-xl max-h-52 overflow-y-auto">
                      {deliveryOptions.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setSelectedDelivery(opt.value); setDeliveryOpen(false) }}
                          className={`w-full text-left px-3 py-2.5 text-sm hover:bg-white/5 transition-colors ${
                            selectedDelivery === opt.value ? 'text-accent' : 'text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="lg:col-span-1">
          <div className="lg:sticky lg:top-0 space-y-4">

            <div className="rounded border border-border bg-surface overflow-hidden">
              <div className="relative aspect-4/3 bg-background overflow-hidden">
                {coverPreview ? (
                  <Image src={coverPreview} alt="preview" fill unoptimized className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-gray-600 text-xs">Cover preview</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded border border-border bg-surface p-4 space-y-3">
              <p className="text-xs font-medium text-gray-400">Pricing summary</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Listing price</span>
                  <span className="text-white">{priceNum > 0 ? `${priceNum.toFixed(2)} coin` : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Platform fee ({resolvedFeePct}% + {resolvedFlatFee})</span>
                  <span className="text-gray-400">{priceNum > 0 ? `−${(fee + resolvedFlatFee).toFixed(2)} coin` : '—'}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm">
                  <span className="text-white font-medium">You receive</span>
                  <span className="text-accent-gold font-bold">{priceNum > 0 ? `${youReceive.toFixed(2)} coin` : '—'}</span>
                </div>
              </div>
            </div>

            {kycStatus === 'approved' ? (
              <button
                type="submit"
                disabled={loading || coverCompressing || additionalCompressing || priceNum < MIN_PRICE}
                className="w-full py-3 rounded bg-success text-black font-bold text-sm hover:bg-success-hover transition-colors disabled:opacity-40"
              >
                {loading ? 'Publishing…' : 'Publish listing'}
              </button>
            ) : (
              <KycSellBanner kycStatus={kycStatus} />
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
