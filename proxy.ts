import { createServerClient } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { NextResponse, type NextRequest } from 'next/server'

const handleI18nRouting = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const protectedPaths = ['/profile', '/listings/new', '/orders', '/wallet']
  const adminPaths = ['/admin']

  const isProtected =
    protectedPaths.some(p => pathname.startsWith(p)) ||
    adminPaths.some(p => pathname.startsWith(p))

  if (isProtected) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const i18nResponse = handleI18nRouting(request)
    supabaseResponse.cookies.getAll().forEach(({ name, value, ...opts }) => {
      i18nResponse.cookies.set(name, value, opts)
    })
    return i18nResponse
  }

  return handleI18nRouting(request)
}

export const config = {
  matcher: ['/((?!_next|_vercel|auth|api|.*\\..*).*)', '/'],
}
