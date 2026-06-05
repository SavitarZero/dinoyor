import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

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
        <Link href="/" className="text-accent font-bold text-xl tracking-widest">
          DINOYOR
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/listings" className="text-gray-400 hover:text-white text-sm transition-colors">
            Marketplace
          </Link>
          {user ? (
            <>
              <Link href="/listings/new" className="text-gray-400 hover:text-white text-sm transition-colors">
                Sell
              </Link>
              <Link href="/orders" className="text-gray-400 hover:text-white text-sm transition-colors">
                Orders
              </Link>
              <Link href="/wallet" className="text-gray-400 hover:text-white text-sm transition-colors">
                Wallet
              </Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
                Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 text-sm transition-colors">
                  Admin
                </Link>
              )}
              <form action={signOut}>
                <button className="text-gray-500 hover:text-white text-sm transition-colors">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1 rounded-lg bg-accent text-black text-sm font-semibold hover:opacity-90"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
