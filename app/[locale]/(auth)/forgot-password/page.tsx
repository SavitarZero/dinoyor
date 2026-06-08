'use client'
import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/lib/actions/auth'

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('')
  const [sent, setSent]         = useState(false)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await requestPasswordReset(email)
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white">Check your email</h1>
        <p className="text-gray-400 text-sm">
          If an account with that email exists, we've sent a password reset link.
        </p>
        <p className="text-gray-600 text-xs">Didn't receive it? Check your spam folder.</p>
        <Link href="/login" className="inline-block mt-2 text-accent text-sm hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Forgot password?</h1>
      <p className="text-gray-400 text-sm mb-6">
        Enter the email linked to your account. You must have verified your email first.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 rounded bg-background border border-border text-white focus:outline-none focus:border-accent placeholder-gray-600"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded bg-accent text-black font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="mt-4 text-center text-gray-500 text-sm">
        <Link href="/login" className="text-accent hover:underline">Back to sign in</Link>
      </p>
    </div>
  )
}
