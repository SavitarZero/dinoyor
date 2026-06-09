'use client'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { signOut } from '@/lib/actions/auth'
import {
  LayoutDashboard,
  Package,
  Wallet,
  LogOut,
  Store,
} from 'lucide-react'

interface Props {
  readonly avatarUrl: string | null
  readonly username: string | null
  readonly email: string
  readonly role: string
  readonly amoBalance: number
}

const BASE_ITEMS = [
  { href: '/profile', label: 'Profile', Icon: LayoutDashboard },
  { href: '/orders',  label: 'Orders',  Icon: Package },
]

const SELLER_ITEMS = [
  { href: '/wallet',      label: 'Wallet',          Icon: Wallet },
  { href: '/listings',    label: 'My Listings',     Icon: Store },
]

export function ProfileDropdown({ avatarUrl, username, email, role, amoBalance }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const initials = (username || email || '?')[0].toUpperCase()
  const isSeller = role === 'seller' || role === 'admin'
  const menuItems = [...BASE_ITEMS, ...(isSeller ? SELLER_ITEMS : [])]

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>

      {/* Avatar trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center focus:outline-none cursor-pointer"
        aria-label="Profile menu"
        aria-expanded={open}
      >
        <span className={`block rounded-full ring-2 transition-all duration-150 ${open ? 'ring-accent/60' : 'ring-transparent hover:ring-accent/60'}`}>
          {avatarUrl ? (
            <Image src={avatarUrl} alt="avatar" width={32} height={32} unoptimized className="rounded-full object-cover" />
          ) : (
            <span className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-black text-xs font-bold">
              {initials}
            </span>
          )}
        </span>
      </button>

      {/* Dropdown */}
      <div className={`absolute right-0 mt-1.5 w-56 rounded border border-border bg-surface shadow-[0_8px_24px_rgba(0,0,0,0.8)] z-[60] overflow-hidden
                      transition-all duration-150
                      ${open ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 translate-y-1'}`}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          {avatarUrl ? (
            <Image src={avatarUrl} alt="avatar" width={36} height={36} unoptimized className="rounded-full object-cover shrink-0" />
          ) : (
            <span className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-black text-sm font-bold shrink-0">
              {initials}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{username || 'User'}</p>
            <p className="text-gray-500 text-xs truncate">{email}</p>
            <p className="text-accent-gold text-xs font-bold mt-0.5 tabular-nums">Coin Wallet · {amoBalance.toFixed(2)} coin</p>
          </div>
        </div>

        {/* Nav items */}
        <div className="py-1">
          {menuItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Icon size={16} className="shrink-0 text-gray-600" />
              {label}
            </Link>
          ))}


        </div>

        {/* Sign out */}
        <div className="border-t border-border py-1">
          <form action={signOut}>
            <button
              type="submit"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
            >
              <LogOut size={16} className="shrink-0" />
              Sign out
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}
