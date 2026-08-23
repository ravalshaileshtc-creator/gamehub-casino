import { Redis } from '@upstash/redis'

// Upstash Redis client (serverless-friendly)
let redis: Redis | null = null

if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
  redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
  })
  console.log('[Redis] Connected to Upstash Redis')
} else {
  console.warn('[Redis] Redis not configured - caching disabled')
}

export default redis

/**
 * Cache service with get/set/delete operations
 */
export class CacheService {
  /**
   * Get value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!redis) return null

    try {
      const value = await redis.get(key)
      return value as T | null
    } catch (error) {
      console.error('[Cache] Get error:', error)
      return null
    }
  }

  /**
   * Set value in cache with optional TTL (seconds)
   */
  static async set(key: string, value: unknown, ttl?: number): Promise<boolean> {
    if (!redis) return false

    try {
      if (ttl) {
        await redis.setex(key, ttl, JSON.stringify(value))
      } else {
        await redis.set(key, JSON.stringify(value))
      }
      return true
    } catch (error) {
      console.error('[Cache] Set error:', error)
      return false
    }
  }

  /**
   * Delete value from cache
   */
  static async delete(key: string): Promise<boolean> {
    if (!redis) return false

    try {
      await redis.del(key)
      return true
    } catch (error) {
      console.error('[Cache] Delete error:', error)
      return false
    }
  }

  /**
   * Increment counter (for rate limiting)
   */
  static async increment(key: string, ttl?: number): Promise<number> {
    if (!redis) return 0

    try {
      const count = await redis.incr(key)
      if (ttl && count === 1) {
        await redis.expire(key, ttl)
      }
      return count
    } catch (error) {
      console.error('[Cache] Increment error:', error)
      return 0
    }
  }

  /**
   * Get or set pattern - get from cache or execute function and cache result
   */
  static async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 300 // 5 minutes default
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Execute function
    const result = await fn()

    // Cache result
    await this.set(key, result, ttl)

    return result
  }

  /**
   * Invalidate cache by pattern (requires scan support)
   */
  static async invalidatePattern(pattern: string): Promise<number> {
    if (!redis) return 0

    try {
      // Note: Upstash Redis doesn't support SCAN, so we track keys manually
      // For now, just delete by exact key
      await redis.del(pattern)
      return 1
    } catch (error) {
      console.error('[Cache] Invalidate error:', error)
      return 0
    }
  }

  /**
   * Clear all cache (use carefully!)
   */
  static async clear(): Promise<boolean> {
    if (!redis) return false

    try {
      await redis.flushdb()
      return true
    } catch (error) {
      console.error('[Cache] Clear error:', error)
      return false
    }
  }
}

/**
 * Cache key generators
 */
export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userBalance: (userId: string) => `user:${userId}:balance`,
  gameSettings: (game: string) => `game:${game}:settings`,
  liveBets: () => 'bets:live',
  userStats: (userId: string) => `user:${userId}:stats`,
  leaderboard: (type: string) => `leaderboard:${type}`,
  rateLimit: (identifier: string, action: string) => `ratelimit:${action}:${identifier}`,
}
