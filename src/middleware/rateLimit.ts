import { NextRequest, NextResponse } from 'next/server'
import { CacheService, CacheKeys } from '@/lib/redis'

interface RateLimitConfig {
  max: number // Maximum requests
  window: number // Time window in seconds
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  reset: number // Unix timestamp when limit resets
}

/**
 * Rate limiting middleware
 */
export async function rateLimitMiddleware(
  req: NextRequest,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Get identifier (IP address or user ID)
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
  const identifier = ip

  // Get action (endpoint path)
  const action = req.nextUrl.pathname

  // Create cache key
  const key = CacheKeys.rateLimit(identifier, action)

  // Increment counter
  const count = await CacheService.increment(key, config.window)

  // Calculate reset time
  const reset = Math.floor(Date.now() / 1000) + config.window

  // Check if limit exceeded
  const allowed = count <= config.max
  const remaining = Math.max(0, config.max - count)

  return {
    allowed,
    remaining,
    reset,
  }
}

/**
 * Common rate limit configurations
 */
export const RateLimits = {
  // Login attempts: 5 per 15 minutes (Brute force protection)
  login: { max: 5, window: 15 * 60 },

  // Registration: 3 per hour
  register: { max: 3, window: 60 * 60 },

  // Bet placement: 20 per minute (Prevent spam)
  bet: { max: 20, window: 60 },

  // Game Actions (Play): 60 per minute (1 per sec average)
  game: { max: 60, window: 60 },

  // Withdrawals: 3 per hour
  withdrawal: { max: 3, window: 60 * 60 },

  // Deposits: 10 per hour
  deposit: { max: 10, window: 60 * 60 },

  // General API calls: 100 per minute
  api: { max: 100, window: 60 },

  // Email sending: 5 per hour
  email: { max: 5, window: 60 * 60 },

  // Auth routes (general): 10 per minute
  auth: { max: 10, window: 60 },
}

/**
 * Helper to create rate limit response
 */
export function rateLimitResponse(result: RateLimitResult, max: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': max.toString(),          // Configured max — was incorrectly using remaining
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': ((result.reset - Math.floor(Date.now() / 1000))).toString(),
      },
    }
  )
}
