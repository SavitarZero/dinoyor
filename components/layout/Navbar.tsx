import { Suspense } from 'react'
import Link from 'next/link'
import { NavbarSearch } from './NavbarSearch'
import { NavbarUser, NavbarUserMobile } from './NavbarUser'

function NavbarUserSkeleton() {
  return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse shrink-0" />
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.6)]">

      {/* ── Desktop ── */}
      <div className="hidden md:flex items-center max-w-7xl mx-auto px-4 h-16 gap-3">
        <Link
          href="/"
          className="font-black text-sm tracking-[0.25em] text-accent hover:opacity-75 transition-opacity shrink-0"
        >
          DINOYOR
        </Link>

        <div className="flex-1 min-w-0 max-w-lg">
          <NavbarSearch />
        </div>

        <div className="ml-auto shrink-0 flex items-center gap-0.5">
          <Suspense fallback={<NavbarUserSkeleton />}>
            <NavbarUser />
          </Suspense>
        </div>
      </div>

      {/* ── Mobile row ── */}
      <div className="flex md:hidden items-center px-4 h-14 gap-3">
        <Link href="/" className="shrink-0 font-black text-sm tracking-[0.25em] text-accent hover:opacity-75 transition-opacity">
          DINOYOR
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <Suspense fallback={<NavbarUserSkeleton />}>
            <NavbarUserMobile />
          </Suspense>
        </div>
      </div>

      {/* ── Mobile search ── */}
      <div className="md:hidden px-4 pb-3">
        <NavbarSearch />
      </div>

    </header>
  )
}
