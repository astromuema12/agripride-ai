const rateMap = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { windowMs: 60_000, maxRequests: 30 }
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateMap.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetIn: config.windowMs };
  }

  entry.count += 1;
  const remaining = config.maxRequests - entry.count;
  const resetIn = entry.resetAt - now;

  if (entry.count > config.maxRequests) {
    return { allowed: false, remaining: 0, resetIn };
  }

  return { allowed: true, remaining, resetIn };
}

export function getRateLimitKey(
  ip?: string,
  userId?: string,
  route?: string
): string {
  return `${route || 'global'}:${userId || ip || 'anonymous'}`;
}
