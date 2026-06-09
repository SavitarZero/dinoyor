'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signUpWithUsername } from '@/lib/actions/auth'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { useTranslations } from 'next-intl'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const router = useRouter()
  const [username, setUsername]               = useState('')
  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword]             = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
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
    const result = await signUpWithUsername(username, password)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    router.push('/login')
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-focus-border transition-colors'

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">{t('createAccount')}</h1>

      {error && (
        <div className="mb-4 px-3 py-2.5 rounded-xl bg-red-900/20 border border-red-700/40">
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
          <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('passwordMin')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className={inputCls}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-400 mb-1.5">Confirm password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={t('confirmPassword')}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className={inputCls}
            />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-success text-black font-bold text-sm hover:bg-success-hover disabled:opacity-50 transition-colors mt-1"
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
