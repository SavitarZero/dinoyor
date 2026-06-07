'use client'
import Image from 'next/image'
import { GameBanner } from '@/components/games/GameImage'

interface Props {
  images: string[]
  title: string
  game: { slug: string; name: string } | null
}

export function ListingImages({ images, title, game }: Props) {
  if (images.length > 0) {
    return (
      <div className="space-y-3">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-surface">
            <Image src={url} alt={title} fill className="object-cover" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative aspect-video rounded-xl overflow-hidden">
      {game ? (
        <>
          <GameBanner src={null} slug={game.slug} name={game.name} className="w-full h-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-3 py-1 rounded-full bg-black/40 text-white/50 text-xs backdrop-blur-sm">
              No images
            </span>
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
