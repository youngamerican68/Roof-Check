/**
 * Rate Limiting Service
 * Simple in-memory rate limiting for API protection
 *
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (use Redis in production for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  });
}, 5 * 60 * 1000);

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // Per IP limits
  ip: {
    analyze: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
    embed: { maxRequests: 30, windowMs: 60 * 1000 },   // 30 requests per minute
    default: { maxRequests: 60, windowMs: 60 * 1000 }, // 60 requests per minute
  },
  // Per roofer limits
  roofer: {
    analyze: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
    default: { maxRequests: 500, windowMs: 60 * 60 * 1000 }, // 500 per hour
  },
} as const;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/**
 * Check rate limit for a given key
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // If no entry or window has reset, start fresh
  if (!entry || entry.resetAt < now) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: newEntry.resetAt,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limit by IP address
 */
export function rateLimitByIP(
  ip: string,
  endpoint: keyof typeof RATE_LIMITS.ip = 'default'
): RateLimitResult {
  const config = RATE_LIMITS.ip[endpoint];
  const key = `ip:${endpoint}:${ip}`;
  return checkRateLimit(key, config);
}

/**
 * Rate limit by roofer ID
 */
export function rateLimitByRoofer(
  rooferId: string,
  endpoint: keyof typeof RATE_LIMITS.roofer = 'default'
): RateLimitResult {
  const config = RATE_LIMITS.roofer[endpoint];
  const key = `roofer:${endpoint}:${rooferId}`;
  return checkRateLimit(key, config);
}

/**
 * Combined rate limit check (both IP and roofer)
 */
export function combinedRateLimit(
  ip: string,
  rooferId: string,
  endpoint: 'analyze' = 'analyze'
): RateLimitResult {
  // Check IP limit first
  const ipResult = rateLimitByIP(ip, endpoint);
  if (!ipResult.allowed) {
    return ipResult;
  }

  // Then check roofer limit
  const rooferResult = rateLimitByRoofer(rooferId, endpoint);
  return rooferResult;
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Check various headers for the real IP
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback
  return '127.0.0.1';
}

/**
 * Create rate limit headers for response
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetAt / 1000).toString(),
  };

  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}
