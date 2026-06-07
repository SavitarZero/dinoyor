import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    if (session?.user) {
      const u    = session.user
      const meta = u.user_metadata ?? {}

      const avatarUrl = (meta.avatar_url ?? meta.picture ?? null) as string | null
      const derivedUsername = (
        meta.preferred_username ?? meta.user_name ?? u.email?.split('@')[0] ?? null
      ) as string | null

      // Always sync email + avatar; create row if missing
      await supabase.from('profiles').upsert(
        { id: u.id, email: u.email, avatar_url: avatarUrl },
        { onConflict: 'id', ignoreDuplicates: false }
      )

      // Set username only if not yet customised
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
