/**
 * Simple in-memory TTL cache for API responses.
 * Reason: Expensive aggregation queries (stats, campaigns) don't need to run
 * on every request. A 30-60s TTL dramatically reduces DB load while keeping
 * data reasonably fresh. This is server-side only (runs in Node.js).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

/**
 * Get a cached value or compute it if missing/expired.
 * @param key - Unique cache key
 * @param ttlSeconds - Time-to-live in seconds (default: 30)
 * @param compute - Async function to compute the value if cache miss
 */
export async function getCachedOrCompute<T>(
  key: string,
  ttlSeconds: number,
  compute: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key) as CacheEntry<T> | undefined;

  if (existing && existing.expiresAt > now) {
    return existing.data;
  }

  const data = await compute();
  cache.set(key, { data, expiresAt: now + ttlSeconds * 1000 });
  return data;
}

/**
 * Invalidate a specific cache entry.
 */
export function invalidateCache(key: string): void {
  cache.delete(key);
}

/**
 * Invalidate all cache entries matching a prefix.
 */
export function invalidateCacheByPrefix(prefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Clear the entire cache.
 */
export function clearCache(): void {
  cache.clear();
}
