'use client'
import { useState } from 'react'
import { signInWithEmail, signInWithOAuth } from '@/lib/actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = await signInWithEmail(email, password)
    if (result?.error) setError(result.error)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Sign in to Dinoyor</h1>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
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
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
        <button type="submit" className="w-full py-2 rounded-lg bg-accent text-black font-semibold hover:opacity-90">
          Sign In
        </button>
      </form>
      <div className="my-4 text-center text-gray-500 text-sm">or</div>
      <div className="space-y-2">
        <button
          onClick={() => signInWithOAuth('google')}
          className="w-full py-2 rounded-lg border border-border text-white hover:border-accent text-sm"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signInWithOAuth('discord')}
          className="w-full py-2 rounded-lg border border-border text-white hover:border-accent text-sm"
        >
          Continue with Discord
        </button>
      </div>
      <p className="mt-4 text-center text-gray-500 text-sm">
        No account?{' '}
        <Link href="/register" className="text-accent hover:underline">Register</Link>
      </p>
    </div>
  )
}
