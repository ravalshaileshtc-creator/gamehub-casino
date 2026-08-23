import prisma from '@/lib/prisma'
import { CacheService } from '@/lib/redis'
import { AuditService } from './audit.service'

export class FraudDetectionService {
  /**
   * Check for multiple accounts from the same IP address
   */
  static async checkMultipleAccountsFromIP(userId: string, ipAddress: string): Promise<{ flagged: boolean; reason?: string }> {
    if (!ipAddress) return { flagged: false }

    // Get accounts with the same IP from recent logins
    const recentAccounts = await prisma.auditLog.findMany({
      where: {
        action: 'LOGIN',
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
        },
        userId: { not: userId },
      },
      distinct: ['userId'],
      take: 5,
    })

    if (recentAccounts.length >= 3) {
      return {
        flagged: true,
        reason: `Multiple accounts (${recentAccounts.length + 1}) detected from IP ${ipAddress}`,
      }
    }

    return { flagged: false }
  }

  /**
   * Detect rapid betting patterns (potential bot)
   */
  static async checkRapidBetting(userId: string): Promise<{ flagged: boolean; reason?: string }> {
    const cacheKey = `bet_timestamps:${userId}`
    const timestamps = (await CacheService.get<number[]>(cacheKey)) || []

    const now = Date.now()
    // Filter timestamps from last minute
    const recentBets = timestamps.filter((ts) => now - ts < 60000)

    // Flag if more than 20 bets in 1 minute
    if (recentBets.length >= 20) {
      await this.flagUser(userId, 'RAPID_BETTING', `${recentBets.length} bets in 1 minute`)
      return {
        flagged: true,
        reason: 'Rapid betting detected (potential bot)',
      }
    }

    // Update timestamps
    recentBets.push(now)
    await CacheService.set(cacheKey, recentBets, 300) // 5 min TTL

    return { flagged: false }
  }

  /**
   * Check for unusual win rate
   */
  static async checkWinRate(userId: string): Promise<{ flagged: boolean; reason?: string }> {
    // Get last 50 bets
    const recentBets = await prisma.bet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        payout: true,
        wager: true,
      },
    })

    if (recentBets.length < 20) {
      return { flagged: false } // Not enough data
    }

    // Calculate win rate
    const wins = recentBets.filter((bet) => bet.payout > bet.wager).length
    const winRate = (wins / recentBets.length) * 100

    // Flag if win rate > 70% (statistically suspicious)
    if (winRate > 70) {
      await this.flagUser(userId, 'HIGH_WIN_RATE', `Win rate: ${winRate.toFixed(1)}%`)
      return {
        flagged: true,
        reason: `Unusually high win rate (${winRate.toFixed(1)}%)`,
      }
    }

    return { flagged: false }
  }

  /**
   * Check for suspicious withdrawal patterns
   */
  static async checkWithdrawalPattern(userId: string, amount: number): Promise<{ flagged: boolean; reason?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        mainBalance: true,
        deposits: {
          where: { status: 'COMPLETED' },
          select: { amount: true },
        },
        withdrawals: {
          where: { status: 'COMPLETED' },
          select: { amount: true },
        },
      },
    })

    if (!user) return { flagged: false }

    const accountAgeHours = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60)
    const totalDeposits = user.deposits.reduce((sum, d) => sum + d.amount, 0)
    const totalWithdrawals = user.withdrawals.reduce((sum, w) => sum + w.amount, 0)

    // Flag if: New account (<24h) trying to withdraw more than they deposited
    if (accountAgeHours < 24 && amount + totalWithdrawals > totalDeposits + 1000) {
      await this.flagUser(userId, 'SUSPICIOUS_WITHDRAWAL', `New account withdrawing ₹${amount}`)
      return {
        flagged: true,
        reason: 'Suspicious withdrawal from new account',
      }
    }

    // Flag if: Withdrawing >90% of balance immediately after deposit
    const recentDeposit = await prisma.deposit.findFirst({
      where: {
        userId,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000), // last 10 minutes
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (recentDeposit && amount > recentDeposit.amount * 0.9) {
      await this.flagUser(userId, 'RAPID_WITHDRAWAL', `Withdrawing ₹${amount} after ₹${recentDeposit.amount} deposit`)
      return {
        flagged: true,
        reason: 'Rapid withdrawal after deposit (possible bonus abuse)',
      }
    }

    return { flagged: false }
  }

  /**
   * Flag a user for manual review
   */
  private static async flagUser(userId: string, type: string, details: string) {
    await AuditService.log({
      userId,
      action: 'FRAUD_FLAG',
      resource: 'USER',
      resourceId: userId,
      changes: { description: `${type}: ${details}` },
    })

    // Optionally notify admins
    console.warn(`🚨 FRAUD FLAG: User ${userId} - ${type}: ${details}`)
  }

  /**
   * Run all fraud checks for a transaction
   */
  static async checkTransaction(userId: string, type: 'deposit' | 'withdrawal', amount: number, ipAddress?: string) {
    const checks = await Promise.all([
      ipAddress ? this.checkMultipleAccountsFromIP(userId, ipAddress) : { flagged: false },
      type === 'withdrawal' ? this.checkWithdrawalPattern(userId, amount) : { flagged: false },
      this.checkWinRate(userId),
      this.checkRapidBetting(userId),
    ])

    const flagged = checks.some((check) => check.flagged)
    const reasons = checks.filter((check) => check.flagged).map((check) => (check as { reason?: string }).reason).filter(Boolean)

    return {
      flagged,
      reasons,
      requiresReview: flagged,
    }
  }
}
