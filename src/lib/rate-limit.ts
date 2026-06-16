import { NextResponse } from 'next/server'

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetMs: number
}

const tiers: Record<string, RateLimitConfig> = {
  auth: { limit: 10, windowMs: 60_000 },
  ai: { limit: 20, windowMs: 60_000 },
  api: { limit: 60, windowMs: 60_000 },
  default: { limit: 100, windowMs: 60_000 },
}

function getTier(pathname: string): keyof typeof tiers {
  if (pathname.startsWith('/api/auth/')) return 'auth'
  if (pathname.startsWith('/api/ai/')) return 'ai'
  if (pathname.startsWith('/api/')) return 'api'
  return 'default'
}

const stores = new Map<string, number[]>()

function slidingWindow(ip: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowStart = now - config.windowMs

  let timestamps = stores.get(ip)
  if (!timestamps) {
    timestamps = []
    stores.set(ip, timestamps)
  }

  const filtered = timestamps.filter((t) => t > windowStart)
  filtered.push(now)
  stores.set(ip, filtered)

  const resetMs = config.windowMs - (now - Math.floor(now / config.windowMs) * config.windowMs)

  return {
    allowed: filtered.length <= config.limit,
    limit: config.limit,
    remaining: Math.max(0, config.limit - filtered.length),
    resetMs,
  }
}

export function rateLimit(request: Request): {
  result: RateLimitResult
  tier: string
} {
  const { pathname } = new URL(request.url)
  const tier = getTier(pathname)
  const config = tiers[tier]
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const result = slidingWindow(ip, config)
  return { result, tier }
}

export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  tier: string
): void {
  response.headers.set('X-RateLimit-Limit', String(result.limit))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetMs / 1000)))
  response.headers.set('X-RateLimit-Tier', tier)
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(result.resetMs / 1000)}s.`,
      status: 429,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(result.resetMs / 1000)),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetMs / 1000)),
      },
    }
  )
}

export function configureRateLimit(overrides: Partial<typeof tiers>): void {
  for (const [key, config] of Object.entries(overrides)) {
    if (key in tiers) {
      (tiers as Record<string, RateLimitConfig>)[key] = {
        ...tiers[key],
        ...config,
      }
    }
  }
}
