import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { BonusService } from '@/services/bonus.service'

/**
 * POST /api/bonuses/daily
 * Claim daily reward
 */
export async function POST() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bonus = await BonusService.grantDailyReward(session.user.id)

    return NextResponse.json({
      success: true,
      bonus,
      message: 'Daily reward claimed successfully!',
    })
  } catch (error) {
    console.error('Daily reward error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to claim daily reward' },
      { status: 500 }
    )
  }
}
