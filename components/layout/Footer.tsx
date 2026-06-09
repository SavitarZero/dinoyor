import Link from 'next/link'

const LINKS = {
  Market: [
    { label: 'Browse Games',   href: '/market' },
    { label: 'Sell an Item',   href: '/listings/new' },
    { label: 'My Orders',      href: '/orders' },
    { label: 'Coin Wallet',    href: '/wallet' },
  ],
  Support: [
    { label: 'How It Works',   href: '/info' },
    { label: 'Fees',           href: '/info#fees' },
    { label: 'Verify Identity',href: '/profile/kyc' },
  ],
  Legal: [
    { label: 'Terms of Service', href: '#' },
    { label: 'Privacy Policy',   href: '#' },
    { label: 'Cookie Policy',    href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="font-black text-sm tracking-[0.25em] text-accent">
              DCORE
            </Link>
            <p className="text-gray-500 text-xs mt-3 leading-relaxed max-w-48">
              P2P marketplace for gaming items. Safe trades with secure payments for SEA gamers.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, items]) => (
            <div key={group}>
              <p className="text-white text-xs font-semibold uppercase tracking-widest mb-3">{group}</p>
              <ul className="space-y-2">
                {items.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href} className="text-gray-500 text-xs hover:text-gray-300 transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-gray-700 text-xs">© {new Date().getFullYear()} DCORE. All rights reserved.</p>
          <p className="text-gray-700 text-xs">Built for SEA gamers 🎮</p>
        </div>
      </div>
    </footer>
  )
}
