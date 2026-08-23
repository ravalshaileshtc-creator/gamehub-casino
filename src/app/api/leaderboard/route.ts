
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'wagered' // 'wagered' | 'profit'

    // Calculate date range (e.g., last 24h or all time)
    // For now, let's just get all time top users to simplify
    // In production, we should use a materialized view or cached aggregation

    // We need to aggregate bets by user
    // Since we use MongoDB, we can use aggregateRaw

    let pipeline = []

    if (type === 'profit') {
      pipeline = [
        { $match: { isWin: true } },
        {
          $group: {
            _id: '$userId',
            totalProfit: { $sum: '$profit' },
            wins: { $sum: 1 }
          }
        },
        { $sort: { totalProfit: -1 } },
        { $limit: 10 }
      ]
    } else {
      // Wagered
      pipeline = [
        {
          $group: {
            _id: '$userId',
            totalWagered: { $sum: '$wager' },
            bets: { $sum: 1 }
          }
        },
        { $sort: { totalWagered: -1 } },
        { $limit: 10 }
      ]
    }

    interface LeaderboardAggregation {
      cursor: {
        firstBatch: Array<{
          _id: string;
          totalWagered?: number;
          totalProfit?: number;
          bets?: number;
          wins?: number;
        }>;
      };
    }

    const leaderboard = await prisma.$runCommandRaw({
      aggregate: 'Bet',
      pipeline: pipeline,
      cursor: {}
    }) as unknown as LeaderboardAggregation

    // We need to fetch user details for these IDs
    // The result from aggregateRaw is { cursor: { firstBatch: [...] } }
    const topUsers = leaderboard.cursor.firstBatch

    // Fetch user details
    const userIds = topUsers.map(u => u._id)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        image: true,
        vipLevel: true
      }
    })

    // Merge data
    const result = topUsers.map(u => {
      const user = users.find(user => user.id === u._id)
      return {
        ...u,
        user: user || { name: 'Unknown User', image: null, vipLevel: 'BRONZE' }
      }
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
