import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/app'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin

  if (!code) {
    return NextResponse.redirect(`${siteUrl}/login?error=nocode`)
  }

  const cookieStore = await cookies()
  const response = NextResponse.redirect(`${siteUrl}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('[callback]', error.message)
    return NextResponse.redirect(`${siteUrl}/login?error=${encodeURIComponent(error.message)}`)
  }

  return response
}