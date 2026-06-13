import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isSupabaseConfigured = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const rateMap = new Map<string, { count: number; resetTime: number }>()
const API_RATE_LIMIT = 60
const API_RATE_WINDOW = 60_000
const AUTH_RATE_LIMIT = 5
const AUTH_RATE_WINDOW = 60_000

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'
}

function checkRateLimit(ip: string, limit: number, window: number): boolean {
  const now = Date.now()
  const record = rateMap.get(ip)
  if (!record || now > record.resetTime) {
    rateMap.set(ip, { count: 1, resetTime: now + window })
    return true
  }
  if (record.count >= limit) return false
  record.count++
  return true
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('X-XSS-Protection', '0')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')

  response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.openai.com https://*.vercel.app",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
  ].join('; ')
  response.headers.set('Content-Security-Policy', csp)

  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request)
    const limit = pathname.startsWith('/api/auth/') ? AUTH_RATE_LIMIT : API_RATE_LIMIT
    const window = pathname.startsWith('/api/auth/') ? AUTH_RATE_WINDOW : API_RATE_WINDOW
    if (!checkRateLimit(ip, limit, window)) {
      return NextResponse.json({ error: 'Too many requests', status: 429 }, { status: 429 })
    }
  }

  if (isSupabaseConfigured) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    const publicPaths = ['/auth', '/api/auth/']
    const isPublic = publicPaths.some(p => pathname.startsWith(p))

    if (pathname.startsWith('/dashboard/') && !session) {
      const url = new URL('/auth', request.url)
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    if (pathname.startsWith('/api/') && !session && !isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
