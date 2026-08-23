import { NextRequest, NextResponse } from 'next/server'
import { processBetTransaction, processWinTransaction } from '@/lib/wallet-engine'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid = 'demo_user', action, stake, minesCount = 3, tileIndex, requestId } = body

    if (!action || !requestId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    if (action === 'start') {
      if (!stake || stake <= 0) {
        return NextResponse.json({ error: 'Invalid stake' }, { status: 400 })
      }

      // Deduct Bet Atomically
      const betResult = await processBetTransaction(uid, stake, 'mines', requestId)
      if (!betResult.success) {
        return NextResponse.json({ error: betResult.error || 'Bet failed' }, { status: 400 })
      }

      // Generate Mine Locations Server-Side
      const minePositions: number[] = []
      while (minePositions.length < minesCount) {
        const rand = crypto.randomInt(0, 25)
        if (!minePositions.includes(rand)) {
          minePositions.push(rand)
        }
      }

      return NextResponse.json({
        success: true,
        action: 'start',
        balance: betResult.balance,
        minesCount,
        requestId,
      })
    }

    if (action === 'reveal') {
      if (typeof tileIndex !== 'number' || tileIndex < 0 || tileIndex > 24) {
        return NextResponse.json({ error: 'Invalid tile index' }, { status: 400 })
      }

      // Authoritative Random Hit Check (or server layout lookup)
      const hitMine = crypto.randomInt(0, 25) < minesCount
      const multiplier = hitMine ? 0 : Number((1 + (tileIndex % 5) * 0.4).toFixed(2))

      return NextResponse.json({
        success: true,
        action: 'reveal',
        hitMine,
        tileIndex,
        multiplier,
      })
    }

    if (action === 'cashout') {
      const payout = Number(stake * (1 + minesCount * 0.35))
      const winResult = await processWinTransaction(uid, payout, 'mines', requestId)

      return NextResponse.json({
        success: true,
        action: 'cashout',
        payout,
        balance: winResult.balance,
      })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err: unknown) {
    console.error('Mines server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
