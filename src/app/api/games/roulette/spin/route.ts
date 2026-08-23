import { NextRequest, NextResponse } from 'next/server'
import { processBetTransaction, processWinTransaction } from '@/lib/wallet-engine'
import crypto from 'crypto'

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid = 'demo_user', stake, betType, selectedValue, requestId } = body

    if (!stake || stake <= 0 || !betType || !requestId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // 1. Deduct Bet Atomically
    const betResult = await processBetTransaction(uid, stake, 'roulette', requestId)
    if (!betResult.success) {
      return NextResponse.json({ error: betResult.error || 'Bet failed' }, { status: 400 })
    }

    // 2. Server-Authoritative European Roulette Spin Outcome (0 to 36)
    const winningPocket = crypto.randomInt(0, 37)

    // 3. Compute Win Condition & Multiplier Payout
    let won = false
    let multiplier = 0

    if (betType === 'RED') {
      won = RED_NUMBERS.includes(winningPocket)
      multiplier = won ? 2.0 : 0
    } else if (betType === 'BLACK') {
      won = winningPocket !== 0 && !RED_NUMBERS.includes(winningPocket)
      multiplier = won ? 2.0 : 0
    } else if (betType === 'EVEN') {
      won = winningPocket !== 0 && winningPocket % 2 === 0
      multiplier = won ? 2.0 : 0
    } else if (betType === 'ODD') {
      won = winningPocket % 2 !== 0
      multiplier = won ? 2.0 : 0
    } else if (betType === 'NUMBER') {
      won = winningPocket === Number(selectedValue)
      multiplier = won ? 36.0 : 0
    }

    const payout = Number((stake * multiplier).toFixed(2))

    // 4. Credit Winnings Atomically (If won)
    let finalBalance = betResult.balance
    if (won && payout > 0) {
      const winResult = await processWinTransaction(uid, payout, 'roulette', requestId)
      if (winResult.success) {
        finalBalance = winResult.balance
      }
    }

    return NextResponse.json({
      success: true,
      winningPocket,
      won,
      multiplier,
      payout,
      balance: finalBalance,
      requestId,
    })
  } catch (err: unknown) {
    console.error('Roulette spin server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
