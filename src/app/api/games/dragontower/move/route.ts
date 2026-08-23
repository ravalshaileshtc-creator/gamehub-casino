import { NextResponse } from 'next/server'
import { getRound, updateRound } from '@/lib/dragonTowerStore'
import { DRAGON_CONFIG } from '@/lib/dragonTowerDb'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { roundId, floor, selectedTile } = body

    if (!roundId || floor === undefined || selectedTile === undefined) {
      return NextResponse.json({ error: 'Missing roundId, floor, or selectedTile.' }, { status: 400 })
    }

    const round = getRound(roundId)
    if (!round) {
      return NextResponse.json({ error: 'Game round not found.' }, { status: 404 })
    }

    if (round.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Game round is already finished.' }, { status: 400 })
    }

    const targetFloorIndex = floor - 1 // 0 to 9
    if (targetFloorIndex !== round.currentFloor) {
      return NextResponse.json({ error: `Invalid move. Must play Floor ${round.currentFloor + 1}.` }, { status: 400 })
    }

    if (selectedTile < 0 || selectedTile > 4) {
      return NextResponse.json({ error: 'Invalid tile index. Must be between 0 and 4.' }, { status: 400 })
    }

    // Evaluate Move vs HMAC-SHA256 Provably Fair Secret Layout
    const isSafe = round.floorLayouts[targetFloorIndex][selectedTile]
    const config = DRAGON_CONFIG[round.difficulty]

    if (isSafe) {
      // SAFE TILE (Golden Egg 🥚)
      const nextFloor = round.currentFloor + 1
      const newMultiplier = config.multipliers[targetFloorIndex]

      round.currentFloor = nextFloor
      round.multiplier = newMultiplier

      if (nextFloor === 10) {
        // TOP FLOOR REACHED! MAX PAYOUT!
        const payout = +(round.betAmount * newMultiplier).toFixed(2)
        round.status = 'CASHED_OUT'
        round.payout = payout
        updateRound(round)

        return NextResponse.json({
          success: true,
          result: 'SAFE',
          isTopFloor: true,
          currentFloor: nextFloor,
          multiplier: newMultiplier,
          payout,
          status: 'CASHED_OUT',
          serverSeed: round.serverSeed,
          serverSeedHash: round.serverSeedHash,
          clientSeed: round.clientSeed,
          nonce: round.nonce,
          floorLayouts: round.floorLayouts
        })
      } else {
        updateRound(round)
        return NextResponse.json({
          success: true,
          result: 'SAFE',
          isTopFloor: false,
          currentFloor: nextFloor,
          multiplier: newMultiplier,
          status: 'IN_PROGRESS'
        })
      }
    } else {
      // DRAGON TILE (Dragon Skull 💀 - BUST!)
      round.status = 'BUSTED'
      round.payout = 0
      updateRound(round)

      return NextResponse.json({
        success: true,
        result: 'DRAGON',
        currentFloor: round.currentFloor,
        multiplier: 0,
        status: 'BUSTED',
        serverSeed: round.serverSeed,
        serverSeedHash: round.serverSeedHash,
        clientSeed: round.clientSeed,
        nonce: round.nonce,
        floorLayouts: round.floorLayouts
      })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process move' }, { status: 500 })
  }
}
