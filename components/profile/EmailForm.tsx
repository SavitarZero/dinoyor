'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateEmail } from '@/lib/actions/auth'

export function EmailForm({ currentEmail }: { currentEmail: string | null }) {
  const router = useRouter()
  const [email, setEmail]   = useState('')
  const [error, setError]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await updateEmail(email)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 text-center space-y-2">
        <p className="text-white font-semibold">Verification email sent</p>
        <p className="text-gray-400 text-sm">
          Click the link in <span className="text-white">{email}</span> to confirm.
          This page will update once verified.
        </p>
        <button
          onClick={() => router.push('/profile')}
          className="mt-2 text-accent text-sm hover:underline"
        >
          Back to profile
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-red-900/20 border border-red-700/50 px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">
          {currentEmail ? 'New email address' : 'Email address'}
        </label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
        />
        <p className="text-gray-600 text-xs mt-1.5">
          A verification link will be sent to this email. Cannot be an email already used by another account.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Sending…' : 'Send verification link'}
      </button>
    </form>
  )
}
