'use client'
import { useState, useTransition } from 'react'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toggleLike } from '@/lib/actions/likes'

interface Props {
  listingId: string
  initialLiked: boolean
  initialCount: number
  isAuthenticated: boolean
  isKycApproved: boolean
}

export function LikeButton({ listingId, initialLiked, initialCount, isAuthenticated, isKycApproved }: Props) {
  const [liked, setLiked] = useState(initialLiked)
  const [count, setCount] = useState(initialCount)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!isAuthenticated) { router.push('/login'); return }
    if (!isKycApproved) { router.push('/profile/kyc'); return }

    const next = !liked
    setLiked(next)
    setCount(c => next ? c + 1 : c - 1)

    startTransition(async () => {
      const res = await toggleLike(listingId)
      if (res.error) {
        setLiked(!next)
        setCount(c => next ? c - 1 : c + 1)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={liked ? 'Unlike' : 'Like'}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all disabled:opacity-60 ${
        liked
          ? 'border-red-500/50 text-red-400 bg-red-500/10'
          : 'border-border text-gray-500 hover:border-red-400/40 hover:text-red-400'
      }`}
    >
      <Heart size={15} className={liked ? 'fill-current' : ''} />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
