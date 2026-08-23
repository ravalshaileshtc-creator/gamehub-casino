import { NextRequest, NextResponse } from 'next/server'
import { processBetTransaction, processWinTransaction } from '@/lib/wallet-engine'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid = 'demo_user', stake = 10, mode = '4digit', chosenNumbers = [1, 2, 3, 4], requestId } = body

    if (!stake || stake <= 0 || !requestId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // 1. Deduct Bet Atomically
    const betResult = await processBetTransaction(uid, stake, 'lottery', requestId)
    if (!betResult.success) {
      return NextResponse.json({ error: betResult.error || 'Ticket purchase failed' }, { status: 400 })
    }

    // 2. Server-Authoritative Winning Ball Numbers Generation
    const totalBalls = mode === 'mega' ? 6 : 4
    const maxVal = mode === 'mega' ? 49 : 9
    const winningBalls: number[] = []

    while (winningBalls.length < totalBalls) {
      const randBall = crypto.randomInt(mode === 'mega' ? 1 : 0, maxVal + 1)
      if (!winningBalls.includes(randBall)) {
        winningBalls.push(randBall)
      }
    }

    // 3. Calculate Matches & Multiplier
    const matchCount = chosenNumbers.filter((n: number) => winningBalls.includes(n)).length
    let multiplier = 0

    if (mode === '4digit') {
      if (matchCount === 4) multiplier = 500.0
      else if (matchCount === 3) multiplier = 25.0
      else if (matchCount === 2) multiplier = 3.0
    } else {
      if (matchCount === 6) multiplier = 2000.0
      else if (matchCount === 5) multiplier = 100.0
      else if (matchCount === 4) multiplier = 10.0
    }

    const payout = Number((stake * multiplier).toFixed(2))

    // 4. Credit Winnings Atomically (If matches found)
    let finalBalance = betResult.balance
    if (payout > 0) {
      const winResult = await processWinTransaction(uid, payout, 'lottery', requestId)
      if (winResult.success) {
        finalBalance = winResult.balance
      }
    }

    return NextResponse.json({
      success: true,
      winningBalls,
      matchCount,
      multiplier,
      payout,
      balance: finalBalance,
      requestId,
    })
  } catch (err: unknown) {
    console.error('Lottery ticket server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
