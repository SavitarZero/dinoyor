import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProfileDropdown } from './ProfileDropdown'
import { NavbarSearch } from './NavbarSearch'
import { Store, Package, Plus } from 'lucide-react'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let profile = null
  let isAdmin = false
  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('username, avatar_url, role')
      .eq('id', user.id)
      .single()
    profile = data
    isAdmin = profile?.role === 'admin'
  }

  const avatarUrl =
    profile?.avatar_url ||
    (user?.user_metadata?.avatar_url as string | undefined) ||
    null

  /* MUI "text button" style */
  const textBtn =
    'inline-flex items-center gap-2 px-3 py-2 rounded text-sm font-medium tracking-wide text-gray-400 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors whitespace-nowrap select-none'

  return (
    /* MUI AppBar — elevation via shadow, no border */
    <header className="sticky top-0 z-50 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.6)]">

      {/* ── Desktop ── */}
      <div className="hidden md:flex items-center max-w-7xl mx-auto px-4 h-16 gap-3">

        {/* Logo */}
        <Link
          href="/"
          className="font-black text-sm tracking-[0.25em] text-accent hover:opacity-75 transition-opacity shrink-0"
        >
          DINOYOR
        </Link>

        {/* Search — flex-1 so it doesn't collide with actions */}
        <div className="flex-1 min-w-0 max-w-lg">
          <NavbarSearch />
        </div>

        {/* Actions */}
        <div className="ml-auto shrink-0 flex items-center gap-0.5">
          {user ? (
            <>
              <Link href="/market" className={`hidden lg:inline-flex ${textBtn}`}>
                <Store size={18} />
                Market
              </Link>

              <Link href="/orders" className={`hidden md:inline-flex ${textBtn}`}>
                <Package size={18} />
                Orders
              </Link>

              {/* MUI Divider */}
              <span className="hidden md:block h-6 w-px bg-white/10 mx-2 shrink-0" />

              {/* Sell — pill accent button */}
              <Link
                href="/listings/new"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold bg-accent text-black hover:opacity-90 active:opacity-80 transition-opacity whitespace-nowrap shadow-[0_0_12px_rgba(0,229,255,0.25)]"
              >
                <Plus size={15} strokeWidth={2.5} />
                Sell
              </Link>

              <div className="ml-2">
                <ProfileDropdown
                  avatarUrl={avatarUrl}
                  username={profile?.username ?? null}
                  email={user.email ?? ''}
                  isAdmin={isAdmin}
                />
              </div>
            </>
          ) : (
            <>
              <Link href="/market" className={textBtn}>
                Market
              </Link>
              <Link href="/login" className={textBtn}>
                Sign in
              </Link>
              <Link
                href="/register"
                className="ml-1 inline-flex items-center px-4 py-2 rounded text-sm font-medium tracking-wide bg-accent text-black shadow-sm hover:shadow-md hover:brightness-110 transition-all"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile row ── */}
      <div className="flex md:hidden items-center px-4 h-14 gap-3">
        <Link href="/" className="shrink-0 font-black text-sm tracking-[0.25em] text-accent hover:opacity-75 transition-opacity">
          DINOYOR
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <Link
                href="/listings/new"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent text-black hover:opacity-90 active:opacity-80 transition-opacity shadow-[0_0_8px_rgba(0,229,255,0.2)]"
              >
                <Plus size={13} strokeWidth={2.5} />
                Sell
              </Link>
              <ProfileDropdown
                avatarUrl={avatarUrl}
                username={profile?.username ?? null}
                email={user.email ?? ''}
                isAdmin={isAdmin}
              />
            </>
          ) : (
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
          )}
        </div>
      </div>

      {/* ── Mobile search ── */}
      <div className="md:hidden px-4 pb-3">
        <NavbarSearch />
      </div>

    </header>
  )
}
