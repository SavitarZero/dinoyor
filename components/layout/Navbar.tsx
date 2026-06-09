import { Suspense } from 'react'
import Link from 'next/link'
import { NavbarSearch } from './NavbarSearch'
import { NavbarUser, NavbarUserMobile } from './NavbarUser'

function NavbarUserSkeleton() {
  return <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse shrink-0" />
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-surface border-b-2 border-accent/60 shadow-[0_2px_12px_rgba(0,0,0,0.7)]">

      {/* ── Desktop ── */}
      <div className="hidden md:flex items-center max-w-7xl mx-auto px-4 h-14 gap-4">
        <Link
          href="/"
          className="font-black text-base tracking-[0.12em] text-accent hover:text-accent-gold transition-colors shrink-0"
        >
          DCORE
        </Link>

        <div className="flex-1 min-w-0 max-w-xl">
          <NavbarSearch />
        </div>

        <div className="ml-auto shrink-0 flex items-center gap-1">
          <Suspense fallback={<NavbarUserSkeleton />}>
            <NavbarUser />
          </Suspense>
        </div>
      </div>

      {/* ── Mobile row ── */}
      <div className="flex md:hidden items-center px-4 h-12 gap-3">
        <Link href="/" className="shrink-0 font-black text-sm tracking-[0.12em] text-accent">
          DCORE
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <Suspense fallback={<NavbarUserSkeleton />}>
            <NavbarUserMobile />
          </Suspense>
        </div>
      </div>

      {/* ── Mobile search ── */}
      <div className="md:hidden px-4 pb-2.5">
        <NavbarSearch />
      </div>

    </header>
  )
}
