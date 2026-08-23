import { NextRequest, NextResponse } from 'next/server'
import { processBetTransaction, processWinTransaction } from '@/lib/wallet-engine'
import crypto from 'crypto'

const BUCKET_MULTIPLIERS = [100, 25, 9, 3, 1.5, 0.4, 0.2, 0.4, 1.5, 3, 9, 25, 100]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid = 'demo_user', stake, requestId } = body

    if (!stake || stake <= 0 || !requestId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // 1. Deduct Bet Atomically
    const betResult = await processBetTransaction(uid, stake, 'plinko', requestId)
    if (!betResult.success) {
      return NextResponse.json({ error: betResult.error || 'Bet failed' }, { status: 400 })
    }

    // 2. Server-Authoritative Path Simulation (12 rows -> bucketIndex 0..12)
    let bucketIndex = 0
    for (let row = 0; row < 12; row++) {
      if (crypto.randomInt(0, 2) === 1) {
        bucketIndex += 1
      }
    }

    const multiplier = BUCKET_MULTIPLIERS[bucketIndex] || 1.0
    const payout = Number((stake * multiplier).toFixed(2))

    // 3. Credit Winnings Atomically (If multiplier > 0)
    let finalBalance = betResult.balance
    if (payout > 0) {
      const winResult = await processWinTransaction(uid, payout, 'plinko', requestId)
      if (winResult.success) {
        finalBalance = winResult.balance
      }
    }

    return NextResponse.json({
      success: true,
      bucketIndex,
      multiplier,
      payout,
      balance: finalBalance,
      requestId,
    })
  } catch (err: unknown) {
    console.error('Plinko drop server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
