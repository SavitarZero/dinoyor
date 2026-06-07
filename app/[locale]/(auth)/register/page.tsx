'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUpWithUsername } from '@/lib/actions/auth'
import { useTranslations } from 'next-intl'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [username, setUsername]             = useState('')
  const [password, setPassword]             = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]                   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }

    const result = await signUpWithUsername(username, password)
    if (result?.error) { setError(result.error); return }
    router.push('/login')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">{t('createAccount')}</h1>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder={t('usernamePlaceholder')}
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={20}
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
        <input
          type="password"
          placeholder={t('passwordMin')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
        <input
          type="password"
          placeholder={t('confirmPassword')}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
        <button type="submit" className="w-full py-2 rounded-lg bg-accent text-black font-semibold hover:opacity-90">
          {t('register')}
        </button>
      </form>
      <div className="my-4 text-center text-gray-500 text-sm">{t('orContinueWith')}</div>
      <button
        onClick={async () => {
          const { signInWithOAuth } = await import('@/lib/actions/auth')
          signInWithOAuth('google')
        }}
        className="w-full py-2 rounded-lg border border-border text-white hover:border-accent text-sm"
      >
        {t('continueWithGoogle')}
      </button>
      <p className="mt-4 text-center text-gray-500 text-sm">
        {t('haveAccount')}{' '}
        <Link href="/login" className="text-accent hover:underline">{t('signIn')}</Link>
      </p>
    </div>
  )
}
