'use client'
import { useState } from 'react'
import { signInWithEmail, signInWithOAuth } from '@/lib/actions/auth'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'

export default function LoginPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
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
      <h1 className="text-2xl font-bold text-white mb-6">{t('signInTitle')}</h1>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
        <button type="submit" className="w-full py-2 rounded-lg bg-accent text-black font-semibold hover:opacity-90">
          {t('signIn')}
        </button>
      </form>
      <div className="my-4 text-center text-gray-500 text-sm">{t('orContinueWith')}</div>
      <button
        onClick={() => signInWithOAuth('google')}
        className="w-full py-2 rounded-lg border border-border text-white hover:border-accent text-sm"
      >
        {t('continueWithGoogle')}
      </button>
      <p className="mt-4 text-center text-gray-500 text-sm">
        {t('noAccount')}{' '}
        <Link href={`/${locale}/register`} className="text-accent hover:underline">{t('register')}</Link>
      </p>
    </div>
  )
}
