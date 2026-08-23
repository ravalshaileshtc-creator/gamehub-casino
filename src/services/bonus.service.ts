import prisma from '@/lib/prisma'
import { WalletService } from './wallet.service'
import { BonusType } from '@prisma/client'

/**
 * Bonus Service - Handles signup bonuses, referrals, daily rewards, cashback, VIP bonuses
 */

export class BonusService {
  /**
   * Grant signup bonus to new user
   */
  static async grantSignupBonus(userId: string) {
    const SIGNUP_BONUS = 100 // ₹100 bonus
    const WAGER_MULTIPLIER = 10 // Must wager 10x bonus

    const bonus = await prisma.userBonus.create({
      data: {
        userId,
        type: BonusType.SIGNUP,
        amount: SIGNUP_BONUS,
        wagerRequired: SIGNUP_BONUS * WAGER_MULTIPLIER,
        wagerCompleted: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    await WalletService.creditBonus(userId, SIGNUP_BONUS, 'Welcome Bonus')

    return bonus
  }

  /**
   * Grant referral bonus
   */
  static async grantReferralBonus(referrerId: string, referredId: string, reason: string) {
    let amount = 0

    switch (reason) {
      case 'SIGNUP':
        amount = 50
        break
      case 'FIRST_DEPOSIT':
        amount = 100
        break
      case 'WAGERED':
        amount = 20
        break
    }

    if (amount > 0) {
      // Credit to referrer
      await prisma.user.update({
        where: { id: referrerId },
        data: {
          referralEarnings: { increment: amount },
          mainBalance: { increment: amount },
        },
      })

      // Record referral reward
      await prisma.referralReward.create({
        data: {
          referrerId,
          referredId,
          amount,
          reason,
        },
      })

      await WalletService.creditBonus(referrerId, amount, `Referral reward: ${reason}`)
    }
  }

  /**
   * Grant daily reward
   */
  static async grantDailyReward(userId: string) {
    // Check if user already claimed today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingClaim = await prisma.userBonus.findFirst({
      where: {
        userId,
        type: BonusType.DAILY,
        claimedAt: { gte: today },
      },
    })

    if (existingClaim) {
      throw new Error('Daily reward already claimed')
    }

    const DAILY_AMOUNT = 10
    const WAGER_MULTIPLIER = 5

    const bonus = await prisma.userBonus.create({
      data: {
        userId,
        type: BonusType.DAILY,
        amount: DAILY_AMOUNT,
        wagerRequired: DAILY_AMOUNT * WAGER_MULTIPLIER,
        wagerCompleted: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    })

    await WalletService.creditBonus(userId, DAILY_AMOUNT, 'Daily Reward')

    return bonus
  }

  /**
   * Calculate and grant cashback on losses
   */
  static async calculateCashback(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { vipLevel: true },
    })

    if (!user) return

    // Get user's losses in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const bets = await prisma.bet.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { profit: true },
    })

    const totalLoss = bets
      .filter(b => b.profit < 0)
      .reduce((sum, b) => sum + Math.abs(b.profit), 0)

    if (totalLoss === 0) return

    // Calculate cashback percentage based on VIP level
    let cashbackPercent = 0
    switch (user.vipLevel) {
      case 'BRONZE':
        cashbackPercent = 0.05 // 5%
        break
      case 'SILVER':
        cashbackPercent = 0.10 // 10%
        break
      case 'GOLD':
        cashbackPercent = 0.15 // 15%
        break
      case 'PLATINUM':
        cashbackPercent = 0.20 // 20%
        break
      case 'DIAMOND':
        cashbackPercent = 0.25 // 25%
        break
    }

    const cashbackAmount = totalLoss * cashbackPercent

    if (cashbackAmount > 0) {
      await prisma.userBonus.create({
        data: {
          userId,
          type: BonusType.CASHBACK,
          amount: cashbackAmount,
          wagerRequired: cashbackAmount * 3, // 3x wagering
          wagerCompleted: 0,
        },
      })

      await WalletService.creditBonus(userId, cashbackAmount, `${cashbackPercent * 100}% Cashback`)
    }
  }

  /**
   * Get active bonuses for user
   */
  static async getActiveBonuses(userId: string) {
    return await prisma.userBonus.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: { claimedAt: 'desc' },
    })
  }

  /**
   * Get bonus history
   */
  static async getBonusHistory(userId: string) {
    return await prisma.userBonus.findMany({
      where: { userId },
      orderBy: { claimedAt: 'desc' },
      take: 50,
    })
  }
}
