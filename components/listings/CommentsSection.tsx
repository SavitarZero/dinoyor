'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addComment } from '@/lib/actions/comments'

interface Comment {
  id: string
  body: string
  created_at: string
  profiles: { username: string | null } | null
}

interface Props {
  listingId: string
  initialComments: Comment[]
  isAuthenticated: boolean
  hasPurchased: boolean
}

export function CommentsSection({ listingId, initialComments, isAuthenticated, hasPurchased }: Props) {
  const [comments, setComments] = useState(initialComments)
  const [body, setBody] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const canComment = isAuthenticated && hasPurchased

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return

    startTransition(async () => {
      const res = await addComment(listingId, body)
      if (!res.error) {
        setComments(prev => [{
          id: crypto.randomUUID(),
          body: body.trim(),
          created_at: new Date().toISOString(),
          profiles: null,
        }, ...prev])
        setBody('')
      }
    })
  }

  return (
    <div>
      <h3 className="text-white font-semibold mb-4">
        Reviews {comments.length > 0 && <span className="text-gray-500 font-normal text-sm">({comments.length})</span>}
      </h3>

      {/* Form or gate */}
      {canComment ? (
        <form onSubmit={handleSubmit} className="mb-6 space-y-2">
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Share your experience with this item..."
            maxLength={500}
            rows={3}
            className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-accent/50 transition-colors"
          />
          <div className="flex items-center justify-between">
            <span className="text-gray-700 text-xs">{body.length}/500</span>
            <button
              type="submit"
              disabled={pending || !body.trim()}
              className="px-4 py-2 rounded-xl bg-accent text-black text-sm font-bold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Post Review
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 rounded-xl border border-border bg-surface/50 text-center">
          {!isAuthenticated ? (
            <p className="text-gray-500 text-sm">
              <button onClick={() => router.push('/login')} className="text-accent hover:underline font-medium">Sign in</button>
              {' '}to leave a review
            </p>
          ) : (
            <p className="text-gray-500 text-sm">Only buyers who completed a purchase can leave a review</p>
          )}
        </div>
      )}

      {/* Comments list */}
      {comments.length === 0 ? (
        <p className="text-gray-600 text-sm">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                {(c.profiles?.username || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-white text-xs font-semibold">{c.profiles?.username ?? 'Buyer'}</span>
                  <span className="text-gray-600 text-[10px]">
                    {new Date(c.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{c.body}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
