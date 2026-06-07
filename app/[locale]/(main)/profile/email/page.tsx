import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmailForm } from '@/components/profile/EmailForm'

export default async function ProfileEmailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const provider = user.app_metadata?.provider
  if (provider && provider !== 'email') redirect('/profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('pending_email')
    .eq('id', user.id)
    .single()

  const hasRealEmail = user.email && !user.email.endsWith('@dinoyor.internal')
  const pendingEmail = profile?.pending_email ?? null

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Recovery Email</h1>
        <p className="text-gray-500 text-sm mt-1">
          Used for password reset only. Must be unique — cannot match any Google or other account.
        </p>
      </div>

      {/* Current status */}
      <div className="rounded-xl border border-border bg-surface p-4 mb-6 space-y-1">
        <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Current email</p>
        {hasRealEmail ? (
          <div className="flex items-center gap-2">
            <p className="text-white text-sm">{user.email}</p>
            <span className="px-1.5 py-0.5 rounded bg-green-900/30 border border-green-700/40 text-green-400 text-xs">Verified</span>
          </div>
        ) : pendingEmail ? (
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <p className="text-white text-sm">{pendingEmail}</p>
              <span className="px-1.5 py-0.5 rounded bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 text-xs">Pending verification</span>
            </div>
            <p className="text-gray-600 text-xs">Check your inbox and click the verification link.</p>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No email set</p>
        )}
      </div>

      <EmailForm currentEmail={hasRealEmail ? user.email! : null} />
    </div>
  )
}
