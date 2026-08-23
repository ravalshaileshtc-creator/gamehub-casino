
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export class IdempotencyService {
  /**
   * Lock a request by key. Throws error if already locked/processing.
   * If completed, returns the stored response.
   */
  static async lock(key: string, userId: string, path: string, params: unknown) {
    // 1. Check if exists
    const existing = await prisma.idempotencyRequest.findUnique({
      where: { key }
    })

    if (existing) {
      // If response exists, it's completed. Return it.
      if (existing.response) {
        return {
          status: 'COMPLETED',
          response: existing.response,
          statusCode: existing.statusCode || 200
        }
      }

      // If no response, check if it's stale (e.g., > 1 minute old) presumably crashed
      const isStale = Date.now() - existing.lockedAt.getTime() > 60 * 1000
      if (!isStale) {
        throw new Error("Request still processing") // 429 or 409
      }

      // If stale, we update/takeover (or just fail? fail safer)
      // For now, let's update lockedAt and retry
      await prisma.idempotencyRequest.update({
        where: { key },
        data: { lockedAt: new Date() }
      })
      return { status: 'PROCESSING' }
    }

    // 2. Create new lock
    await prisma.idempotencyRequest.create({
      data: {
        key,
        userId,
        path,
        params: params || {},
        lockedAt: new Date()
      }
    })

    return { status: 'PROCESSING' }
  }

  /**
   * Complete a request by storing the response.
   */
  static async complete(key: string, response: unknown, statusCode: number) {
    try {
      await prisma.idempotencyRequest.update({
        where: { key },
        data: {
          response: response as Prisma.InputJsonValue,
          statusCode: statusCode
        }
      })
    } catch (e) {
      console.error("Failed to complete idempotency request", e)
      // Request might have been deleted/expired
    }
  }

  /**
   * Generate a deterministic key if client doesn't provide one (e.g. hash of params + userId)
   */
  static generateKey(userId: string, path: string, params: unknown): string {
    const data = JSON.stringify({ userId, path, params })
    // Simple hash (for demo, use crypto in prod)
    let hash = 0, i, chr;
    if (data.length === 0) return hash.toString();
    for (i = 0; i < data.length; i++) {
      chr = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + chr;
      hash |= 0; // Convert to 32bit integer
    }
    return `auto-${hash}`;
  }
}
