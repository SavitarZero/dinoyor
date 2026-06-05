'use client'
import { useState } from 'react'
import { signUpWithEmail } from '@/lib/actions/auth'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = await signUpWithEmail(email, password)
    if (result?.error) setError(result.error)
    if (result?.success) setMessage(result.success)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Create Account</h1>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {message && <p className="text-accent text-sm mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
        <input
          type="password"
          placeholder="Password (min 8 chars)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
        <button type="submit" className="w-full py-2 rounded-lg bg-accent text-black font-semibold hover:opacity-90">
          Create Account
        </button>
      </form>
      <p className="mt-4 text-center text-gray-500 text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-accent hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
