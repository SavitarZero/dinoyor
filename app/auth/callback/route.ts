import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type')
  const next       = searchParams.get('next') ?? '/profile'

  const supabase = await createClient()

  // Handle email verification / password recovery token
  if (tokenHash && type) {
    const { data: { user }, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'email_change' | 'recovery' | 'signup',
    })

    if (!error && user) {
      // Sync verified email + clear pending_email in profile
      await supabase.from('profiles').update({
        email: user.email,
        pending_email: null,
      }).eq('id', user.id)
    }

    if (error) return NextResponse.redirect(`${origin}/login?error=invalid_link`)
    return NextResponse.redirect(`${origin}${next}`)
  }

  // Handle OAuth code exchange
  if (code) {
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    if (session?.user) {
      const u    = session.user
      const meta = u.user_metadata ?? {}

      const avatarUrl = (meta.avatar_url ?? meta.picture ?? null) as string | null
      const derivedUsername = (
        meta.preferred_username ?? meta.user_name ?? u.email?.split('@')[0] ?? null
      ) as string | null

      await supabase.from('profiles').upsert(
        { id: u.id, email: u.email, avatar_url: avatarUrl },
        { onConflict: 'id', ignoreDuplicates: false }
      )

      if (derivedUsername) {
        await supabase
          .from('profiles')
          .update({ username: derivedUsername })
          .eq('id', u.id)
          .is('username', null)
      }
    }
  }

  return NextResponse.redirect(`${origin}/profile`)
}
