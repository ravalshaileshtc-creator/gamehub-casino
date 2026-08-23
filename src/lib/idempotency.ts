
import prisma from "@/lib/prisma"

export class IdempotencyService {
  /**
   * Check if a key exists and returns its status/response.
   * Throws if key is locked (processing).
   */
  static async check(key: string) {
    const existing = await prisma.idempotencyRequest.findUnique({
      where: { key }
    })

    if (!existing) return null

    // If request exists but no response/status yet, it's pending/locked
    if (existing.statusCode === null) {
      // Check if lock is stale (e.g. > 1 min)
      const now = new Date()
      const lockAge = now.getTime() - existing.lockedAt.getTime()

      if (lockAge > 60000) {
        // Stale lock - assume failed/crashed and allow retry (delete or update)
        // For safety in money matters, we might want to manually review, but for now allow retry
        await prisma.idempotencyRequest.delete({ where: { key } })
        return null
      }

      throw new Error("Request is being processed (Idempotency Lock)")
    }

    return existing
  }

  /**
   * Create a lock for this key.
   */
  static async lock(key: string, userId: string, path: string, params?: unknown) {
    // Attempt to create. If key exists, unique constraint might fail or we handled it in check()
    // Using upsert or strict create. Strict create is better for idempotency.
    try {
      await prisma.idempotencyRequest.create({
        data: {
          key,
          userId,
          path,
          params: params ? JSON.parse(JSON.stringify(params)) : undefined,
          lockedAt: new Date()
        }
      })
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002') {
        throw new Error("Request already exists")
      }
      throw e
    }
  }

  /**
   * Update the record with the response.
   */
  static async complete(key: string, statusCode: number, response: unknown) {
    await prisma.idempotencyRequest.update({
      where: { key },
      data: {
        statusCode,
        response: response ? JSON.parse(JSON.stringify(response)) : undefined
      }
    })
  }
}
