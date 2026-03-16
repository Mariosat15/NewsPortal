/**
 * In-memory sliding-window rate limiter.
 * Reason: Protects public API endpoints (tracking, auth) from abuse
 * without requiring external infrastructure (Redis). Suitable for
 * single-instance deployments.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 60 });
 *   const result = limiter.check(ip);
 *   if (!result.allowed) return NextResponse.json({...}, { status: 429 });
 */

interface RateLimiterOptions {
  windowMs: number; // Time window in milliseconds
  max: number;      // Max requests per window
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function createRateLimiter(options: RateLimiterOptions) {
  const { windowMs, max } = options;
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup to prevent memory leaks (every 5 minutes)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (entry.resetAt < now) store.delete(key);
    }
  }, 5 * 60 * 1000);

  // Prevent the interval from blocking Node.js shutdown
  if (cleanupInterval.unref) cleanupInterval.unref();

  return {
    check(key: string): RateLimitResult {
      const now = Date.now();
      const entry = store.get(key);

      if (!entry || entry.resetAt < now) {
        // New window
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
      }

      entry.count++;
      const allowed = entry.count <= max;
      return {
        allowed,
        remaining: Math.max(0, max - entry.count),
        resetAt: entry.resetAt,
      };
    },

    /** Manually reset a key (useful after successful auth) */
    reset(key: string): void {
      store.delete(key);
    },
  };
}

// Pre-configured limiters for common use cases
export const trackingLimiter = createRateLimiter({ windowMs: 60_000, max: 120 }); // 120/min
export const authLimiter = createRateLimiter({ windowMs: 15 * 60_000, max: 15 }); // 15/15min
export const apiLimiter = createRateLimiter({ windowMs: 60_000, max: 60 });       // 60/min
