import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { EmailForm } from '@/components/profile/EmailForm'

function CurrentEmailStatus({ email, pendingEmail, hasRealEmail }: Readonly<{ email: string | undefined; pendingEmail: string | null; hasRealEmail: boolean }>) {
  if (hasRealEmail) return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-white text-sm">{email}</p>
        <p className="text-green-400 text-xs">Verified</p>
      </div>
    </div>
  )
  if (pendingEmail) return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-white text-sm">{pendingEmail}</p>
        <p className="text-yellow-400 text-xs">Pending — check your inbox</p>
      </div>
    </div>
  )
  return <p className="text-gray-500 text-sm">No email set</p>
}

export default async function ProfileEmailPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, avatar_url, pending_email, role')
    .eq('id', user.id)
    .single()

  const provider = user.app_metadata?.provider as string | undefined
  const isOAuthUser = !!(provider && provider !== 'email')
  const hasRealEmail = !!(user.email && !user.email.endsWith('@dinoyor.internal'))
  const pendingEmail = profile?.pending_email ?? null

  const displayAvatar = profile?.avatar_url || (user.user_metadata?.avatar_url as string | undefined) || null
  const displayName = profile?.username || user.email?.split('@')[0] || 'User'
  const isSeller = profile?.role === 'seller' || profile?.role === 'admin'

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="lg:sticky lg:top-24 space-y-4">

            <div className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-surface">
              {displayAvatar ? (
                <img src={displayAvatar} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm font-black shrink-0">
                  {displayName[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate">{displayName}</p>
              </div>
            </div>

            <nav className="rounded-2xl border border-border bg-surface overflow-hidden">
              <Link href="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/[0.02] transition-colors border-l-2 border-transparent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Overview
              </Link>
              <Link href="/orders" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/[0.02] transition-colors border-l-2 border-transparent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Orders
              </Link>
              <Link href="/profile/email" className="flex items-center gap-3 px-4 py-3 text-sm text-white bg-white/[0.03] border-l-2 border-accent">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </Link>
              {isSeller && (
                <Link href="/wallet" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/[0.02] transition-colors border-l-2 border-transparent">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Wallet
                </Link>
              )}
              <Link href="/profile/kyc" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-white/[0.02] transition-colors border-l-2 border-transparent">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Link>
            </nav>

          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 space-y-6">

          <div>
            <h2 className="text-white text-base font-bold">Email</h2>
            <p className="text-gray-500 text-xs mt-0.5">
              {isOAuthUser ? 'Your email is managed by your login provider.' : 'Used for password reset. Must be unique to your account.'}
            </p>
          </div>

          {isOAuthUser ? (
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Connected account</p>
                <span className="px-2 py-0.5 rounded-full bg-blue-900/30 border border-blue-700/40 text-blue-400 text-xs font-medium capitalize">{provider}</span>
              </div>
              <div className="px-4 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm">{user.email}</p>
                  <p className="text-gray-500 text-xs">Managed by {provider} — cannot be changed here</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Current</p>
                </div>
                <div className="px-4 py-4">
                  <CurrentEmailStatus email={user.email} pendingEmail={pendingEmail} hasRealEmail={hasRealEmail} />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-white text-sm font-semibold">{hasRealEmail ? 'Change email' : 'Add email'}</p>
                </div>
                <div className="px-4 py-4">
                  <EmailForm currentEmail={hasRealEmail ? user.email! : null} />
                </div>
              </div>
            </>
          )}

        </main>
      </div>
    </div>
  )
}
