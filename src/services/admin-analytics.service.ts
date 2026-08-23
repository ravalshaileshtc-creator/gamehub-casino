import prisma from '@/lib/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export class AdminAnalyticsService {
  /**
   * Get basic overview stats
   */
  static async getOverviewStats() {
    const [
      totalUsers,
      totalWagered,
      totalPayout,
      totalDeposits,
      totalWithdrawals,
      pendingWithdrawals,
      activeBets
    ] = await Promise.all([
      prisma.user.count(),
      prisma.bet.aggregate({ _sum: { wager: true } }),
      prisma.bet.aggregate({ _sum: { payout: true } }),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'DEPOSIT', status: 'COMPLETED' } }),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: 'WITHDRAWAL', status: 'COMPLETED' } }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      prisma.bet.count() // Just show total bets as 'active' or 0 if we don't have pending state
    ])

    const wagered = totalWagered._sum.wager || 0
    const payout = totalPayout._sum.payout || 0

    return {
      totalUsers,
      totalWagered: wagered,
      totalPayout: payout,
      platformProfit: wagered - payout,
      totalDeposits: totalDeposits._sum.amount || 0,
      totalWithdrawals: Math.abs(totalWithdrawals._sum.amount || 0),
      pendingWithdrawals,
      activeBets,
      activeUsers: Math.floor(totalUsers * 0.15) // Placeholder for demo, or implement real activity tracking
    }
  }

  /**
   * Get daily stats for the last X days (for charts)
   */
  static async getDailyStats(days: number = 7) {
    const stats = []

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      const start = startOfDay(date)
      const end = endOfDay(date)

      const [bets, deposits, withdrawals] = await Promise.all([
        prisma.bet.aggregate({
          _sum: { wager: true, payout: true },
          where: { createdAt: { gte: start, lte: end } }
        }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: 'DEPOSIT', status: 'COMPLETED', createdAt: { gte: start, lte: end } }
        }),
        prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { type: 'WITHDRAWAL', status: 'COMPLETED', createdAt: { gte: start, lte: end } }
        })
      ])

      const dailyWagered = bets._sum.wager || 0
      const dailyPayout = bets._sum.payout || 0

      stats.push({
        date: start.toISOString().split('T')[0],
        wagered: dailyWagered,
        payout: dailyPayout,
        profit: dailyWagered - dailyPayout,
        deposits: deposits._sum.amount || 0,
        withdrawals: Math.abs(withdrawals._sum.amount || 0)
      })
    }

    return stats
  }

  /**
   * Get game-specific stats breakdown
   */
  static async getGameStats() {
    const gameStats = await prisma.bet.groupBy({
      by: ['game'],
      _sum: { wager: true, payout: true },
      _count: { id: true }
    })

    return gameStats.map(stat => ({
      game: stat.game,
      count: stat._count.id,
      wagered: stat._sum.wager || 0,
      payout: stat._sum.payout || 0,
      profit: (stat._sum.wager || 0) - (stat._sum.payout || 0)
    }))
  }
}
