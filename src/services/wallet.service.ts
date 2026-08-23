import prisma from '@/lib/prisma'
import { TransactionType, TransactionStatus, Prisma } from '@prisma/client'

/**
 * Wallet Service - Handles all wallet operations with transactional integrity
 * CRITICAL: This is the ONLY service that should modify user balances
 */

export class WalletService {
  /**
   * Get user's complete wallet information
   */
  static async getWallet(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        mainBalance: true,
        bonusBalance: true,
        lockedBalance: true,
        vipLevel: true,
        totalWagered: true,
      },
    })

    if (!user) throw new Error('User not found')

    return {
      mainBalance: user.mainBalance,
      bonusBalance: user.bonusBalance,
      lockedBalance: user.lockedBalance,
      totalBalance: user.mainBalance + user.bonusBalance,
      vipLevel: user.vipLevel,
      totalWagered: user.totalWagered,
    }
  }

  /**
   * Lock balance for pending bets
   * CRITICAL: Must be called before processing bet
   */
  static async lockBalance(
    userId: string,
    amount: number,
    metadata?: Prisma.InputJsonValue
  ) {
    // Update balances atomically
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { mainBalance: true, bonusBalance: true, lockedBalance: true },
      })

      if (!user) throw new Error('User not found')

      // Check if user has sufficient balance
      const availableBalance = user.mainBalance + user.bonusBalance
      if (availableBalance < amount) {
        throw new Error('Insufficient balance')
      }

      // Determine how much to take from main vs bonus
      let fromMain = 0
      let fromBonus = 0

      if (user.mainBalance >= amount) {
        fromMain = amount
      } else {
        fromMain = user.mainBalance
        fromBonus = amount - user.mainBalance
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          mainBalance: { decrement: fromMain },
          bonusBalance: { decrement: fromBonus },
          lockedBalance: { increment: amount },
        },
      })

      // Create transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.BET,
          amount: -amount,
          balanceBefore: user.mainBalance + user.bonusBalance,
          balanceAfter: updated.mainBalance + updated.bonusBalance,
          balanceType: 'locked',
          status: TransactionStatus.PENDING,
          description: 'Bet placed - balance locked',
          metadata: metadata || {},
        },
      })

      return {
        lockedAmount: amount,
        newMainBalance: updated.mainBalance,
        newBonusBalance: updated.bonusBalance,
        newLockedBalance: updated.lockedBalance,
      }
    })
  }

  /**
   * Lock balance for pending withdrawals
   */
  static async lockForWithdrawal(
    userId: string,
    amount: number,
    withdrawalId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { mainBalance: true, lockedBalance: true },
      })

      if (!user) throw new Error('User not found')

      if (user.mainBalance < amount) {
        throw new Error('Insufficient balance')
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          mainBalance: { decrement: amount },
          lockedBalance: { increment: amount },
        },
      })

      // Create pending transaction record
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.WITHDRAWAL,
          amount: -amount,
          balanceBefore: user.mainBalance,
          balanceAfter: updated.mainBalance,
          balanceType: 'locked',
          status: TransactionStatus.PENDING,
          description: 'Withdrawal requested - balance locked',
          referenceId: withdrawalId,
        },
      })

      return updated
    })
  }

  /**
   * Refund locked withdrawal balance if rejected or cancelled
   */
  static async refundWithdrawal(
    userId: string,
    amount: number,
    withdrawalId: string,
    reason?: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { mainBalance: true, lockedBalance: true },
      })

      if (!user) throw new Error('User not found')

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          lockedBalance: { decrement: amount },
          mainBalance: { increment: amount },
        },
      })

      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.ADJUSTMENT,
          amount: amount,
          balanceBefore: user.mainBalance,
          balanceAfter: updated.mainBalance,
          balanceType: 'main',
          status: TransactionStatus.COMPLETED,
          description: `Withdrawal refund: ${reason || 'Rejected'}`,
          referenceId: withdrawalId,
        },
      })

      return updated
    })
  }

  /**
   * Release locked balance and credit winnings
   */
  static async releaseAndCredit(
    userId: string,
    lockedAmount: number,
    winAmount: number,
    metadata?: Prisma.InputJsonValue
  ) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { mainBalance: true, bonusBalance: true, lockedBalance: true },
      })

      if (!user) throw new Error('User not found')

      // Update balances
      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          lockedBalance: { decrement: lockedAmount },
          mainBalance: { increment: winAmount },
        },
      })

      // Create win transaction
      if (winAmount > 0) {
        await tx.transaction.create({
          data: {
            userId,
            type: TransactionType.WIN,
            amount: winAmount,
            balanceBefore: user.mainBalance,
            balanceAfter: updated.mainBalance,
            balanceType: 'main',
            status: TransactionStatus.COMPLETED,
            description: `Won ${winAmount}`,
            metadata: metadata || {},
          },
        })
      }

      return {
        profit: winAmount - lockedAmount,
        newMainBalance: updated.mainBalance,
        newLockedBalance: updated.lockedBalance,
      }
    })
  }

  /**
   * Deposit funds to user account
   */
  static async deposit(
    userId: string,
    amount: number,
    depositId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { mainBalance: true },
      })

      if (!user) throw new Error('User not found')

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          mainBalance: { increment: amount },
        },
      })

      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.DEPOSIT,
          amount,
          balanceBefore: user.mainBalance,
          balanceAfter: updated.mainBalance,
          balanceType: 'main',
          status: TransactionStatus.COMPLETED,
          description: 'Deposit',
          referenceId: depositId,
        },
      })

      return { newBalance: updated.mainBalance }
    })
  }

  /**
   * Complete withdrawal from locked balance (call after external payment success)
   */
  static async completeWithdrawalFromLocked(
    userId: string,
    amount: number,
    withdrawalId: string
  ) {
    return await prisma.$transaction(async (tx) => {
      // Fetch both lockedBalance AND mainBalance so we have real values for the audit record
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { mainBalance: true, lockedBalance: true },
      })

      if (!user) throw new Error('User not found')

      if (user.lockedBalance < amount) {
        throw new Error('Locked balance insufficient for withdrawal completion')
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          lockedBalance: { decrement: amount },
        },
        select: { mainBalance: true, lockedBalance: true },
      })

      // Create a COMPLETED audit record. The balance was already moved from main→locked
      // during lockForWithdrawal, so balanceBefore/After here track the locked pool.
      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.WITHDRAWAL,
          amount: -amount, // Negative: funds permanently leave the platform
          balanceBefore: user.mainBalance,
          balanceAfter: updated.mainBalance,
          balanceType: 'main',
          status: TransactionStatus.COMPLETED,
          description: 'Withdrawal completed – funds released from locked pool',
          referenceId: withdrawalId,
        },
      })

      return updated
    })
  }

  /**
   * Withdraw funds from user account (Instant/Direct)
   */
  static async withdraw(
    userId: string,
    amount: number,
    fee: number,
    withdrawalId: string
  ) {
    const totalDeduction = amount + fee
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { mainBalance: true },
      })

      if (!user) throw new Error('User not found')

      if (user.mainBalance < totalDeduction) {
        throw new Error('Insufficient balance')
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          mainBalance: { decrement: totalDeduction },
        },
      })

      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.WITHDRAWAL,
          amount: -totalDeduction,
          balanceBefore: user.mainBalance,
          balanceAfter: updated.mainBalance,
          balanceType: 'main',
          status: TransactionStatus.COMPLETED,
          description: `Withdrawal (Fee: ${fee})`,
          referenceId: withdrawalId,
          metadata: { amount, fee },
        },
      })

      return { newBalance: updated.mainBalance }
    })
  }

  /**
   * Get transaction history
   */
  static async getTransactions(
    userId: string,
    limit: number = 50,
    skip: number = 0
  ) {
    return await prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    })
  }

  /**
   * Credit bonus to user
   */
  static async creditBonus(
    userId: string,
    amount: number,
    description: string
  ) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { bonusBalance: true },
      })

      if (!user) throw new Error('User not found')

      const updated = await tx.user.update({
        where: { id: userId },
        data: {
          bonusBalance: { increment: amount },
        },
      })

      await tx.transaction.create({
        data: {
          userId,
          type: TransactionType.BONUS,
          amount,
          balanceBefore: user.bonusBalance,
          balanceAfter: updated.bonusBalance,
          balanceType: 'bonus',
          status: TransactionStatus.COMPLETED,
          description,
        },
      })

      return { newBonusBalance: updated.bonusBalance }
    })
  }
}
