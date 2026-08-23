import { NextRequest, NextResponse } from 'next/server'
import { processBetTransaction, processWinTransaction } from '@/lib/wallet-engine'
import crypto from 'crypto'

const SYMBOLS = ['7️⃣', '💎', '🔔', '🍒', '🍋', '🍇']

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { uid = 'demo_user', stake, requestId } = body

    if (!stake || stake <= 0 || !requestId) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    // 1. Deduct Bet Atomically
    const betResult = await processBetTransaction(uid, stake, 'slots', requestId)
    if (!betResult.success) {
      return NextResponse.json({ error: betResult.error || 'Bet failed' }, { status: 400 })
    }

    // 2. Server-Authoritative 3-Reel Symbol Generation
    const reel1 = SYMBOLS[crypto.randomInt(0, SYMBOLS.length)]
    const reel2 = SYMBOLS[crypto.randomInt(0, SYMBOLS.length)]
    const reel3 = SYMBOLS[crypto.randomInt(0, SYMBOLS.length)]
    const reels = [reel1, reel2, reel3]

    // 3. Compute Win Multiplier
    let multiplier = 0
    if (reel1 === reel2 && reel2 === reel3) {
      if (reel1 === '7️⃣') multiplier = 25.0
      else if (reel1 === '💎') multiplier = 15.0
      else if (reel1 === '🔔') multiplier = 10.0
      else multiplier = 5.0
    } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
      multiplier = 1.5
    }

    const won = multiplier > 0
    const payout = Number((stake * multiplier).toFixed(2))

    // 4. Credit Winnings Atomically (If won)
    let finalBalance = betResult.balance
    if (won && payout > 0) {
      const winResult = await processWinTransaction(uid, payout, 'slots', requestId)
      if (winResult.success) {
        finalBalance = winResult.balance
      }
    }

    return NextResponse.json({
      success: true,
      reels,
      won,
      multiplier,
      payout,
      balance: finalBalance,
      requestId,
    })
  } catch (err: unknown) {
    console.error('Slots spin server error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
