import { createServerClient } from '@supabase/ssr'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { NextResponse, type NextRequest } from 'next/server'

const handleI18nRouting = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Strip locale prefix for path matching
  const pathWithoutLocale = pathname.replace(/^\/(en|th)/, '') || '/'
  const locale = routing.locales.find(l => pathname.startsWith(`/${l}`)) ?? routing.defaultLocale

  const protectedPaths = ['/dashboard', '/listings/new', '/orders', '/wallet', '/profile']
  const adminPaths = ['/admin']

  // Check auth for protected routes
  if (
    protectedPaths.some(p => pathWithoutLocale.startsWith(p)) ||
    adminPaths.some(p => pathWithoutLocale.startsWith(p))
  ) {
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
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
  }

  // Handle i18n routing (locale detection + redirects)
  return handleI18nRouting(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
