import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ListingCard } from '@/components/listings/ListingCard'
import type { ListingWithGame } from '@/lib/types'
import { getTranslations, getLocale } from 'next-intl/server'

export default async function HomePage() {
  const supabase = await createClient()
  const t = await getTranslations('home')
  const locale = await getLocale()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, price_amount, price_currency, images, status, seller_id, games(name, slug, logo_url)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(8)

  return (
    <div>
      <section className="py-28 text-center px-4 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.07) 0%, transparent 70%)' }}
        />
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-5 relative">
          {t('hero.title')}<br />
          <span className="text-accent">{t('hero.titleAccent')}</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto mb-10 text-lg relative">
          {t('hero.subtitle')}
        </p>
        <div className="flex justify-center gap-4 relative">
          <Link href={`/${locale}/listings`} className="px-6 py-3 rounded-lg bg-accent text-black font-semibold hover:opacity-90">
            {t('hero.browse')}
          </Link>
          <Link href={`/${locale}/register`} className="px-6 py-3 rounded-lg border border-border text-white hover:border-accent transition-colors">
            {t('hero.sell')}
          </Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-20">
        <h2 className="text-xl font-bold text-white mb-8 text-center">{t('howItWorks')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {(['find', 'pay', 'confirm'] as const).map(key => (
            <div key={key} className="rounded-xl border border-border bg-surface p-6">
              <p className="text-accent font-bold text-sm mb-2">{t(`steps.${key}.step`)}</p>
              <p className="text-white font-semibold">{t(`steps.${key}.title`)}</p>
              <p className="text-gray-400 text-sm mt-1">{t(`steps.${key}.desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {listings && listings.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">{t('recentListings')}</h2>
            <Link href={`/${locale}/listings`} className="text-accent text-sm hover:underline">{t('seeAll')}</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(listings as unknown as ListingWithGame[]).map(l => (
              <ListingCard key={l.id} listing={l} locale={locale} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
