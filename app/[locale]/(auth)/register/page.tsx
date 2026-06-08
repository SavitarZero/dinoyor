'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUpWithUsername } from '@/lib/actions/auth'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { useTranslations } from 'next-intl'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [username, setUsername]               = useState('')
  const [email, setEmail]                     = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError]                     = useState('')
  const [loading, setLoading]                 = useState(false)

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError(t('passwordMismatch'))
      return
    }
    setLoading(true)
    const result = await signUpWithUsername(username, password, email || undefined)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    router.push('/login')
  }

  const inputCls = 'w-full px-4 py-2.5 rounded bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent transition-colors'

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">{t('createAccount')}</h1>
      <p className="text-gray-500 text-sm mb-6">Add your email now or later — required for password reset.</p>

      {error && (
        <div className="mb-4 px-3 py-2.5 rounded bg-red-900/20 border border-red-700/40">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="username" className="block text-xs font-medium text-gray-400 mb-1.5">Username</label>
          <input
            id="username"
            type="text"
            placeholder="e.g. gamer123"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={20}
            className={inputCls}
          />
          <p className="text-gray-600 text-[11px] mt-1">3–20 characters, letters, numbers or underscore</p>
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-1.5">
            Email address <span className="text-gray-600 font-normal">(optional — for password reset)</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputCls}
          />
          <p className="text-gray-600 text-[11px] mt-1">Not shown publicly · can be added later from your profile</p>
        </div>

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
          <input
            id="password"
            type="password"
            placeholder={t('passwordMin')}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            className={inputCls}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-400 mb-1.5">Confirm password</label>
          <input
            id="confirmPassword"
            type="password"
            placeholder={t('confirmPassword')}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded bg-accent text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
        >
          {loading ? 'Creating account…' : t('register')}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-gray-600 text-xs">{t('orContinueWith')}</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <GoogleButton label={t('continueWithGoogle')} />

      <p className="mt-4 text-center text-gray-500 text-sm">
        {t('haveAccount')}{' '}
        <Link href="/login" className="text-accent hover:underline">{t('signIn')}</Link>
      </p>
    </div>
  )
}
