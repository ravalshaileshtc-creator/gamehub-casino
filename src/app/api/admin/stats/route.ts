import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { AdminAnalyticsService } from '@/services/admin-analytics.service'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '7')

    const [overview, daily, games, pendingWithdrawals, activeBets] = await Promise.all([
      AdminAnalyticsService.getOverviewStats(),
      AdminAnalyticsService.getDailyStats(days),
      AdminAnalyticsService.getGameStats(),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      prisma.bet.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      stats: {
        ...overview,
        daily,
        games,
        pendingWithdrawals,
        activeBets
      }
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({
      success: false,
      error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to fetch stats'
    }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
