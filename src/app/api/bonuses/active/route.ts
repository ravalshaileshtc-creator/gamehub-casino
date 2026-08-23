import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { BonusService } from '@/services/bonus.service'

/**
 * GET /api/bonuses/active
 * Get active bonuses
 */
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bonuses = await BonusService.getActiveBonuses(session.user.id)

    return NextResponse.json({ success: true, bonuses })
  } catch (error) {
    console.error('Active bonuses error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to get bonuses' },
      { status: 500 }
    )
  }
}


export const dynamic = "force-dynamic";
