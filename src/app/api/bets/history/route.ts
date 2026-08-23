import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { BettingService } from '@/services/betting.service'

/**
 * GET /api/bets/history
 * Get user's bet history
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    const bets = await BettingService.getBetHistory(
      session.user.id,
      limit,
      skip
    )

    return NextResponse.json({ success: true, bets })
  } catch (error) {
    console.error('Bet history error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to get bet history' },
      { status: 500 }
    )
  }
}


export const dynamic = "force-dynamic";
