import { NextRequest, NextResponse } from 'next/server'
import { processBetTransaction, processWinTransaction } from '@/lib/wallet-engine'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid = 'demo_user', stake, target, mode = 'under', requestId } = body

    if (!stake || stake <= 0 || target < 1 || target > 99 || !requestId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // 1. Process Bet Deduction Atomically
    const betResult = await processBetTransaction(uid, stake, 'dice', requestId)
    if (!betResult.success) {
      return NextResponse.json({ error: betResult.error || 'Bet deduction failed' }, { status: 400 })
    }

    // 2. Server-Authoritative Random Roll Generation (0.00 to 99.99)
    const randomBuffer = crypto.randomBytes(4)
    const randomInt = randomBuffer.readUInt32BE(0)
    const rollResult = Number(((randomInt % 10000) / 100).toFixed(2))

    // 3. Compute Win Condition & Multiplier Payout
    let won = false
    let winChance = 50

    if (mode === 'under') {
      won = rollResult < target
      winChance = target
    } else {
      won = rollResult > target
      winChance = 100 - target
    }

    // Multiplier calculation with 1% house edge
    const multiplier = won ? Number((99 / winChance).toFixed(2)) : 0
    const payout = won ? Number((stake * multiplier).toFixed(2)) : 0

    // 4. Process Win Winnings Atomically (If won)
    let finalBalance = betResult.balance
    if (won && payout > 0) {
      const winResult = await processWinTransaction(uid, payout, 'dice', requestId)
      if (winResult.success) {
        finalBalance = winResult.balance
      }
    }

    return NextResponse.json({
      success: true,
      rollResult,
      won,
      multiplier,
      payout,
      balance: finalBalance,
      requestId,
    })
  } catch (err: unknown) {
    console.error('Dice roll engine error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
