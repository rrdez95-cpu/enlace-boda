import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) return NextResponse.next()

  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    })

    const { data: { user } } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const isAuthPage = path.startsWith('/login') || path.startsWith('/auth')
    const isPublic = path === '/' || isAuthPage

    if (!user && !isPublic) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/login'
      return NextResponse.redirect(redirectUrl)
    }

    if (user && path.startsWith('/login')) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/app'
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
  } catch (e) {
    console.error('[proxy]', e)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}