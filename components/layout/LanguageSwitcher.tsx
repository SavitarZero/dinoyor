'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { routing } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(next: string) {
    // Replace current locale prefix with new one
    const withoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/'
    router.push(`/${next}${withoutLocale}`)
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      {routing.locales.map(l => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-2 py-0.5 rounded transition-colors ${
            locale === l
              ? 'text-accent font-semibold'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          {l === 'en' ? 'EN' : 'ไทย'}
        </button>
      ))}
    </div>
  )
}
