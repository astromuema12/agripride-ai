import { logger } from './logger';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
  name: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const configs: Record<string, RateLimitConfig> = {
  global: { limit: 100, windowMs: 60_000, name: 'global' },
  auth: { limit: 10, windowMs: 60_000, name: 'auth' },
  ai: { limit: 20, windowMs: 60_000, name: 'ai' },
  api: { limit: 60, windowMs: 60_000, name: 'api' },
  upload: { limit: 5, windowMs: 60_000, name: 'upload' },
};

const stores = new Map<string, RateLimitEntry>();

function getConfig(pathname: string): RateLimitConfig {
  if (pathname.startsWith('/api/auth/')) return configs.auth;
  if (pathname.startsWith('/api/ai/')) return configs.ai;
  if (pathname.startsWith('/api/upload')) return configs.upload;
  if (pathname.startsWith('/api/')) return configs.api;
  return configs.global;
}

function getKey(ip: string, userId: string | undefined, configName: string): string {
  const identifier = userId || ip;
  return `${configName}:${identifier}`;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(
  request: Request,
  userId?: string,
): RateLimitResult {
  const { pathname } = new URL(request.url);
  const config = getConfig(pathname);
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const key = getKey(ip, userId, config.name);
  const now = Date.now();

  let entry = stores.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + config.windowMs };
    stores.set(key, entry);
    return {
      allowed: true,
      limit: config.limit,
      remaining: config.limit - 1,
      resetMs: config.windowMs,
    };
  }

  entry.count++;
  const remaining = config.limit - entry.count;
  const resetMs = entry.resetAt - now;

  if (entry.count > config.limit) {
    if (entry.count === config.limit + 1) {
      logger.warn(`Rate limit exceeded for ${key}`, {
        component: 'rate-limiter',
        metadata: { path: pathname, limit: config.limit, windowMs: config.windowMs },
      });
    }
    return { allowed: false, limit: config.limit, remaining: 0, resetMs };
  }

  return { allowed: true, limit: config.limit, remaining, resetMs };
}

export function applyRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
): void {
  headers.set('X-RateLimit-Limit', String(result.limit));
  headers.set('X-RateLimit-Remaining', String(result.remaining));
  headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetMs / 1000)));
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(result.resetMs / 1000)}s.`,
      status: 429,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(result.resetMs / 1000)),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(result.resetMs / 1000)),
      },
    },
  );
}

export function cleanupStores() {
  const now = Date.now();
  for (const [key, entry] of stores.entries()) {
    if (now > entry.resetAt) {
      stores.delete(key);
    }
  }
}

setInterval(cleanupStores, 60_000);
