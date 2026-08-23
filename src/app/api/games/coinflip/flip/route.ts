import { NextRequest, NextResponse } from 'next/server'
import { processBetTransaction, processWinTransaction } from '@/lib/wallet-engine'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid = 'demo_user', stake, choice = 'heads', requestId } = body

    if (!stake || stake <= 0 || !requestId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // 1. Deduct Bet Atomically
    const betResult = await processBetTransaction(uid, stake, 'coinflip', requestId)
    if (!betResult.success) {
      return NextResponse.json({ error: betResult.error || 'Bet failed' }, { status: 400 })
    }

    // 2. Server-Authoritative Coin Flip Generation (HEADS / TAILS)
    const outcome = crypto.randomInt(0, 2) === 0 ? 'heads' : 'tails'
    const won = outcome === choice.toLowerCase()

    const multiplier = won ? 1.95 : 0
    const payout = won ? Number((stake * multiplier).toFixed(2)) : 0

    // 3. Credit Winnings Atomically (If won)
    let finalBalance = betResult.balance
    if (won && payout > 0) {
      const winResult = await processWinTransaction(uid, payout, 'coinflip', requestId)
      if (winResult.success) {
        finalBalance = winResult.balance
      }
    }

    return NextResponse.json({
      success: true,
      outcome,
      choice,
      won,
      multiplier,
      payout,
      balance: finalBalance,
      requestId,
    })
  } catch (err: unknown) {
    console.error('Coinflip server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
