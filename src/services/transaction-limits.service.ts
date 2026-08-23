import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/redis'

// VIP level limits (in INR)
const VIP_LIMITS = {
  BRONZE: { minWithdrawal: 100, maxWithdrawal: 10000, dailyWithdrawal: 25000, minDeposit: 100, maxDeposit: 50000 },
  SILVER: { minWithdrawal: 100, maxWithdrawal: 25000, dailyWithdrawal: 100000, minDeposit: 100, maxDeposit: 100000 },
  GOLD: { minWithdrawal: 100, maxWithdrawal: 50000, dailyWithdrawal: 250000, minDeposit: 100, maxDeposit: 250000 },
  PLATINUM: { minWithdrawal: 100, maxWithdrawal: 100000, dailyWithdrawal: 500000, minDeposit: 100, maxDeposit: 500000 },
  DIAMOND: { minWithdrawal: 100, maxWithdrawal: 250000, dailyWithdrawal: 1000000, minDeposit: 100, maxDeposit: 1000000 },
}

export class TransactionLimitService {
  /**
   * Get transaction limits for a user based on VIP level
   */
  static async getUserLimits(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vipLevel: true, kycStatus: true },
    })

    if (!user) {
      throw new Error('User not found')
    }

    const limits = VIP_LIMITS[user.vipLevel]

    // KYC affects limits
    const kycMultiplier = user.kycStatus === 'APPROVED' ? 2 : 1

    return {
      deposit: {
        min: limits.minDeposit,
        max: limits.maxDeposit * kycMultiplier,
      },
      withdrawal: {
        min: limits.minWithdrawal,
        max: limits.maxWithdrawal * kycMultiplier,
        dailyMax: limits.dailyWithdrawal * kycMultiplier,
      },
      vipLevel: user.vipLevel,
      kycApproved: user.kycStatus === 'APPROVED',
    }
  }

  /**
   * Check if withdrawal is within daily limit
   */
  static async checkDailyWithdrawalLimit(userId: string, amount: number): Promise<{ allowed: boolean; remaining: number; message?: string }> {
    const limits = await this.getUserLimits(userId)
    const dailyMax = limits.withdrawal.dailyMax

    // Get today's withdrawal total from cache
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `daily_withdrawal:${userId}:${today}`

    const cachedTotal = await CacheService.get<number>(cacheKey)
    const todayTotal = cachedTotal || 0

    const newTotal = todayTotal + amount

    if (newTotal > dailyMax) {
      return {
        allowed: false,
        remaining: dailyMax - todayTotal,
        message: `Daily withdrawal limit exceeded. You can withdraw ₹${(dailyMax - todayTotal).toFixed(2)} more today.`,
      }
    }

    return {
      allowed: true,
      remaining: dailyMax - newTotal,
    }
  }

  /**
   * Record withdrawal in daily limit tracker
   */
  static async recordWithdrawal(userId: string, amount: number) {
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `daily_withdrawal:${userId}:${today}`

    const cachedTotal = await CacheService.get<number>(cacheKey)
    const currentTotal = cachedTotal || 0
    const newTotal = currentTotal + amount

    // Store with 24-hour expiry (resets at midnight)
    const now = new Date()
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
    const ttl = Math.floor((endOfDay.getTime() - now.getTime()) / 1000)

    await CacheService.set(cacheKey, newTotal, ttl)

    return newTotal
  }

  /**
   * Validate transaction against limits
   */
  static async validateTransaction(
    userId: string,
    type: 'deposit' | 'withdrawal',
    amount: number
  ): Promise<{ valid: boolean; error?: string }> {
    const limits = await this.getUserLimits(userId)
    const typeLimits = type === 'deposit' ? limits.deposit : limits.withdrawal

    // Check min/max
    if (amount < typeLimits.min) {
      return {
        valid: false,
        error: `Minimum ${type} amount is ₹${typeLimits.min}`,
      }
    }

    if (amount > typeLimits.max) {
      return {
        valid: false,
        error: `Maximum ${type} amount is ₹${typeLimits.max}${limits.kycApproved ? '' : '. Complete KYC to increase limits.'}`,
      }
    }

    // Check daily limit for withdrawals
    if (type === 'withdrawal') {
      const dailyCheck = await this.checkDailyWithdrawalLimit(userId, amount)
      if (!dailyCheck.allowed) {
        return {
          valid: false,
          error: dailyCheck.message,
        }
      }
    }

    return { valid: true }
  }

  /**
   * Get user's current daily withdrawal usage
   */
  static async getDailyWithdrawalUsage(userId: string) {
    const limits = await this.getUserLimits(userId)
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `daily_withdrawal:${userId}:${today}`

    const used = (await CacheService.get<number>(cacheKey)) || 0
    const limit = limits.withdrawal.dailyMax

    return {
      used,
      limit,
      remaining: limit - used,
      percentage: (used / limit) * 100,
    }
  }
}
