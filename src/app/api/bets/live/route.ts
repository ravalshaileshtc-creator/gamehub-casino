import { NextRequest, NextResponse } from 'next/server'
import { BettingService } from '@/services/betting.service'

/**
 * GET /api/bets/live
 * Get live bets feed (public)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '30')

    const bets = await BettingService.getLiveBets(limit)

    return NextResponse.json({ success: true, bets })
  } catch (error) {
    console.error('Live bets error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to get live bets' },
      { status: 500 }
    )
  }
}


export const dynamic = "force-dynamic";
