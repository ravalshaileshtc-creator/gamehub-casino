
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { AdminAnalyticsService } from '@/services/admin-analytics.service'

export async function GET(req: Request) {
  const session = await auth()

  if (session?.user?.role !== 'ADMIN' && session?.user?.role !== 'SUPER_ADMIN') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const period = searchParams.get('period') || '7d'
  const days = period === '30d' ? 30 : period === '90d' ? 90 : 7

  try {
    const dailyStats = await AdminAnalyticsService.getDailyStats(days)

    // Transform for the frontend chart requirements
    const data = dailyStats.map(stat => ({
      date: new Date(stat.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      revenue: stat.profit, // The frontend calls it revenue, but it's net profit
      users: 0, // Need to implement user growth in service if needed, or keeping it 0 for now
      bets: 0
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Analytics error:', error)
    const message = error instanceof Error ? error.message : 'Unknown analytics error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
