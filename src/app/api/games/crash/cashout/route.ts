import { NextRequest, NextResponse } from 'next/server'
import { processBetTransaction, processWinTransaction } from '@/lib/wallet-engine'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid = 'demo_user', action, stake, targetMultiplier = 2.0, requestId } = body

    if (!action || !requestId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    if (action === 'bet') {
      const betResult = await processBetTransaction(uid, stake, 'crash', requestId)
      if (!betResult.success) {
        return NextResponse.json({ error: betResult.error || 'Bet failed' }, { status: 400 })
      }

      // Generate Server-Authoritative Crash Multiplier Point
      const randInt = crypto.randomInt(1, 100)
      let crashPoint = 1.0
      if (randInt > 5) {
        // Exponential distribution formula for Crash multiplier curve
        const rawPoint = 0.99 / (1 - (randInt / 100))
        crashPoint = Number(Math.min(100.0, Math.max(1.01, rawPoint)).toFixed(2))
      }

      return NextResponse.json({
        success: true,
        action: 'bet',
        crashPoint,
        balance: betResult.balance,
        requestId,
      })
    }

    if (action === 'cashout') {
      const payout = Number((stake * targetMultiplier).toFixed(2))
      const winResult = await processWinTransaction(uid, payout, 'crash', requestId)

      return NextResponse.json({
        success: true,
        action: 'cashout',
        multiplier: targetMultiplier,
        payout,
        balance: winResult.balance,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (err: unknown) {
    console.error('Crash server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
