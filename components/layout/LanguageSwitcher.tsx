'use client'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Globe } from 'lucide-react'
import { routing } from '@/i18n/routing'

const labels: Record<string, string> = {
  en: 'English',
  th: 'ภาษาไทย',
}

const flags: Record<string, string> = {
  en: '🇺🇸',
  th: '🇹🇭',
}

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function switchLocale(next: string) {
    const withoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/'
    router.push(`/${next}${withoutLocale}`)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors text-sm"
      >
        <Globe size={14} />
        <span>{flags[locale]} {locale.toUpperCase()}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-40 rounded-xl border border-border bg-surface shadow-lg py-1 z-50">
          {routing.locales.map(l => (
            <button
              key={l}
              onClick={() => switchLocale(l)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-background transition-colors ${
                locale === l ? 'text-accent' : 'text-foreground'
              }`}
            >
              <span>{flags[l]}</span>
              <span>{labels[l]}</span>
              {locale === l && <span className="ml-auto text-accent text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
