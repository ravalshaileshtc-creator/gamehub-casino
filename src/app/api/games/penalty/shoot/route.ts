import { NextRequest, NextResponse } from 'next/server'
import { processBetTransaction, processWinTransaction } from '@/lib/wallet-engine'
import crypto from 'crypto'

const ZONE_MULTIPLIERS: Record<number, number> = {
  1: 2.0,  // Top Left
  2: 1.8,  // Top Center
  3: 2.0,  // Top Right
  4: 3.5,  // Bottom Left
  5: 4.8,  // Bottom Center (Risk Corner)
  6: 3.5,  // Bottom Right
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid = 'demo_user', stake, targetZone = 1, requestId } = body

    if (!stake || stake <= 0 || !requestId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // 1. Deduct Bet Atomically
    const betResult = await processBetTransaction(uid, stake, 'penalty', requestId)
    if (!betResult.success) {
      return NextResponse.json({ error: betResult.error || 'Bet failed' }, { status: 400 })
    }

    // 2. Server-Authoritative Goalkeeper Dive (1 to 6)
    const keeperDiveZone = crypto.randomInt(1, 7)
    const scoredGoal = keeperDiveZone !== targetZone

    const multiplier = scoredGoal ? (ZONE_MULTIPLIERS[targetZone] || 2.0) : 0
    const payout = scoredGoal ? Number((stake * multiplier).toFixed(2)) : 0

    // 3. Credit Winnings Atomically (If goal scored)
    let finalBalance = betResult.balance
    if (scoredGoal && payout > 0) {
      const winResult = await processWinTransaction(uid, payout, 'penalty', requestId)
      if (winResult.success) {
        finalBalance = winResult.balance
      }
    }

    return NextResponse.json({
      success: true,
      targetZone,
      keeperDiveZone,
      scoredGoal,
      multiplier,
      payout,
      balance: finalBalance,
      requestId,
    })
  } catch (err: unknown) {
    console.error('Penalty shoot server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
