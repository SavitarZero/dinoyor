'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateEmail } from '@/lib/actions/auth'

export function EmailForm({ currentEmail }: { currentEmail: string | null }) {
  const router = useRouter()
  const [email, setEmail]   = useState('')
  const [error, setError]   = useState('')
  const [sent, setSent]         = useState(false)
  const [immediate, setImmediate] = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await updateEmail(email)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setImmediate('immediate' in result && result.immediate === true)
    setSent(true)
  }

  if (sent && immediate) {
    return (
      <div className="space-y-2">
        <p className="text-white text-sm font-medium">Email saved — {email}</p>
        <p className="text-gray-500 text-xs">Your recovery email is now set.</p>
        <button onClick={() => router.refresh()} className="text-accent text-xs hover:underline">
          Refresh
        </button>
      </div>
    )
  }

  if (sent) {
    return (
      <div className="space-y-2">
        <p className="text-white text-sm font-medium">Verification link sent to {email}</p>
        <p className="text-gray-500 text-xs">Click the link in your inbox to confirm. This page will update once verified.</p>
        <button onClick={() => router.refresh()} className="text-accent text-xs hover:underline">
          Refresh status
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        placeholder={currentEmail ? 'New email address' : 'your@email.com'}
        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-focus-border transition-colors"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-gray-600 text-xs">We'll send a verification link.</p>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 rounded-lg bg-success text-black text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Sending…' : 'Send link'}
        </button>
      </div>
    </form>
  )
}
