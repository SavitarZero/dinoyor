'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resetPassword } from '@/lib/actions/auth'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    const result = await resetPassword(password)
    setLoading(false)

    if (result?.error) { setError(result.error); return }
    router.push('/profile?reset=success')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Set new password</h1>
      <p className="text-gray-400 text-sm mb-6">Choose a strong password for your account.</p>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="password"
          placeholder="New password (min 8 characters)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-focus-border placeholder-gray-600"
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-focus-border placeholder-gray-600"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-accent text-black font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
