import { cache } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProfileDropdown } from './ProfileDropdown'
import { NotificationBell } from './NotificationBell'
import { Store, Package, Plus } from 'lucide-react'

const textBtn =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium tracking-wide text-gray-400 hover:text-foreground hover:bg-surface-2 active:bg-surface-2 transition-colors whitespace-nowrap select-none'

const getNavbarData = cache(async () => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  let profile = null
  let role: string = 'user'
  let amoBalance = 0
  if (user) {
    const [{ data: profileData }, { data: balanceData }] = await Promise.all([
      supabase.from('profiles').select('username, avatar_url, role').eq('id', user.id).single(),
      supabase.from('user_balances').select('balance').eq('user_id', user.id).eq('currency', 'USDT').maybeSingle(),
    ])
    profile = profileData
    role = profile?.role ?? 'user'
    amoBalance = Number(balanceData?.balance ?? 0)
  }

  const avatarUrl =
    profile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    null

  return { user, profile, role, avatarUrl, amoBalance }
})

export async function NavbarUser() {
  const { user, profile, role, avatarUrl, amoBalance } = await getNavbarData()

  if (!user) {
    return (
      <>
        <Link href="/market" className={textBtn}>Market</Link>
        <Link href="/login" className={textBtn}>Sign in</Link>
        <Link
          href="/register"
          className="ml-1 inline-flex items-center px-4 py-2 rounded text-sm font-medium tracking-wide bg-accent text-black shadow-sm hover:shadow-md hover:brightness-110 transition-all"
        >
          Register
        </Link>
      </>
    )
  }

  const isSeller = role === 'seller' || role === 'admin'

  return (
    <>
      <Link href="/market" className={`hidden lg:inline-flex ${textBtn}`}>
        <Store size={18} />
        Market
      </Link>
      <Link href="/orders" className={`hidden md:inline-flex ${textBtn}`}>
        <Package size={18} />
        Orders
      </Link>
      {isSeller && (
        <Link href="/listings/new" className={`hidden md:inline-flex ${textBtn}`}>
          <Plus size={18} />
          Sell
        </Link>
      )}
      <span className="hidden md:block h-6 w-px bg-white/10 mx-2 shrink-0" />
      <Link
        href="/wallet"
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-surface-2 hover:border-gray-500 transition-colors mr-3"
      >
        <span className="text-accent-gold text-xs font-bold tabular-nums">{amoBalance.toFixed(2)}</span>
        <span className="text-muted text-[10px] font-medium">AMO</span>
      </Link>
      <NotificationBell userId={user.id} />
      <ProfileDropdown
        avatarUrl={avatarUrl}
        username={profile?.username ?? null}
        email={user.email ?? ''}
        role={role}
        amoBalance={amoBalance}
      />
    </>
  )
}

export async function NavbarUserMobile() {
  const { user, profile, role, avatarUrl, amoBalance } = await getNavbarData()

  if (!user) {
    return (
      <>
        <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-2">
          Sign in
        </Link>
        <Link
          href="/register"
          className="px-3 py-1.5 rounded text-xs font-medium tracking-wide bg-accent text-black shadow-sm hover:brightness-110 transition-all"
        >
          Register
        </Link>
      </>
    )
  }

  const isSeller = role === 'seller' || role === 'admin'

  return (
    <>
      <Link
        href="/wallet"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-border bg-surface-2 hover:border-gray-500 transition-colors"
      >
        <span className="text-accent-gold text-xs font-bold tabular-nums">{amoBalance.toFixed(2)}</span>
        <span className="text-muted text-[10px] font-medium">AMO</span>
      </Link>
      {isSeller && (
        <Link href="/listings/new" className={textBtn}>
          <Plus size={16} />
          Sell
        </Link>
      )}
      <ProfileDropdown
        avatarUrl={avatarUrl}
        username={profile?.username ?? null}
        email={user.email ?? ''}
        role={role}
        amoBalance={amoBalance}
      />
    </>
  )
}
