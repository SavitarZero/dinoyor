'use client'
import { useState } from 'react'
import Image from 'next/image'
import { GameBanner } from '@/components/games/GameImage'

interface Props {
  images: string[]
  title: string
  game: { slug: string; name: string } | null
}

export function ListingImages({ images, title, game }: Props) {
  const [current, setCurrent] = useState(0)

  if (images.length === 0) {
    return (
      <div className="relative aspect-video rounded-xl overflow-hidden">
        {game ? (
          <>
            <GameBanner src={null} slug={game.slug} name={game.name} className="w-full h-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="px-3 py-1 rounded-full bg-black/40 text-white/50 text-xs backdrop-blur-sm">No images</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-surface flex items-center justify-center text-gray-600">
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
    )
  }

  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)

  return (
    <div className="space-y-2">
      {/* Main frame */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-surface group">
        <Image
          key={current}
          src={images[current]}
          alt={title}
          fill
          className="object-cover"
          priority={current === 0}
        />

        {/* Prev / Next — only show if multiple images */}
        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`rounded-full transition-all ${
                    i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnail strip — only if > 1 image */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                i === current ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <Image src={url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
