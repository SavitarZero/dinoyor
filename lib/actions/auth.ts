'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function signInWithUsername(username: string, password: string) {
  const supabase = await createClient()

  // Look up the generated email from profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('username', username)
    .maybeSingle()

  if (!profile?.email) return { error: 'Username or password is incorrect' }

  const { error } = await supabase.auth.signInWithPassword({ email: profile.email, password })
  if (error) return { error: 'Username or password is incorrect' }
  redirect('/profile')
}

export async function signUpWithUsername(username: string, password: string) {
  const supabase = await createClient()

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
    return { error: 'Username must be 3–20 characters, letters, numbers or underscore only' }
  }

  // Check username taken
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) return { error: 'Username is already taken' }

  // Use admin client to create user with email pre-confirmed (no email sent)
  const admin = createAdminClient()
  const { error } = await admin.auth.admin.createUser({
    email: `${username}@dinoyor.internal`,
    password,
    email_confirm: true,
    user_metadata: { user_name: username },
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function signInWithOAuth(provider: 'google' | 'discord') {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback` },
  })
  if (error) return { error: error.message }
  if (data.url) redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function updateEmail(email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Block Google/OAuth users — their email is managed by the provider
  const provider = user.app_metadata?.provider
  if (provider && provider !== 'email') {
    return { error: 'Email is managed by your login provider and cannot be changed here' }
  }

  const trimmed = email.trim().toLowerCase()

  // Let Supabase handle uniqueness — it rejects if another verified account has this email
  const { error } = await supabase.auth.updateUser({ email: trimmed })
  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { error: 'This email is already used by another account' }
    }
    return { error: error.message }
  }

  // Store pending email so we can show "awaiting verification" state
  await supabase.from('profiles').update({ pending_email: trimmed }).eq('id', user.id)

  return { success: true }
}

export async function requestPasswordReset(email: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  })
  // Always return success to avoid email enumeration
  if (error) console.error('[resetPassword]', error.message)
  return { success: true }
}

export async function resetPassword(password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }
  return { success: true }
}
