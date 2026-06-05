import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { getTranslations, getLocale } from 'next-intl/server'
import { LanguageSwitcher } from './LanguageSwitcher'
import { ThemeToggle } from './ThemeToggle'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getTranslations('nav')
  const locale = await getLocale()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  return (
    <header className="border-b border-border bg-surface sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={`/${locale}`} className="text-accent font-bold text-xl tracking-widest">
          DINOYOR
        </Link>
        <nav className="flex items-center gap-5">
          <Link href={`/${locale}/listings`} className="text-gray-400 hover:text-white text-sm transition-colors">
            {t('marketplace')}
          </Link>
          {user ? (
            <>
              <Link href={`/${locale}/listings/new`} className="text-gray-400 hover:text-white text-sm transition-colors">
                {t('sell')}
              </Link>
              <Link href={`/${locale}/orders`} className="text-gray-400 hover:text-white text-sm transition-colors">
                {t('orders')}
              </Link>
              <Link href={`/${locale}/wallet`} className="text-gray-400 hover:text-white text-sm transition-colors">
                {t('wallet')}
              </Link>
              <Link href={`/${locale}/dashboard`} className="text-gray-400 hover:text-white text-sm transition-colors">
                {t('dashboard')}
              </Link>
              {isAdmin && (
                <Link href={`/${locale}/admin`} className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors">
                  {t('admin')}
                </Link>
              )}
              <form action={signOut}>
                <button className="text-gray-500 hover:text-white text-sm transition-colors">
                  {t('signOut')}
                </button>
              </form>
            </>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="px-3 py-1 rounded-lg bg-accent text-black text-sm font-semibold hover:opacity-90"
            >
              {t('signIn')}
            </Link>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
