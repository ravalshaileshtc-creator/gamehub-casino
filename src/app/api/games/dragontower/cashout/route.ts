import { NextResponse } from 'next/server'
import { getRound, updateRound } from '@/lib/dragonTowerStore'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { roundId } = body

    if (!roundId) {
      return NextResponse.json({ error: 'Missing roundId.' }, { status: 400 })
    }

    const round = getRound(roundId)
    if (!round) {
      return NextResponse.json({ error: 'Game round not found.' }, { status: 404 })
    }

    if (round.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Game round is already finished.' }, { status: 400 })
    }

    if (round.currentFloor === 0) {
      return NextResponse.json({ error: 'Cannot cash out on floor 0. Play at least 1 floor.' }, { status: 400 })
    }

    const payout = +(round.betAmount * round.multiplier).toFixed(2)
    round.status = 'CASHED_OUT'
    round.payout = payout
    updateRound(round)

    return NextResponse.json({
      success: true,
      status: 'CASHED_OUT',
      multiplier: round.multiplier,
      payout,
      serverSeed: round.serverSeed,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
      floorLayouts: round.floorLayouts
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to cash out' }, { status: 500 })
  }
}
