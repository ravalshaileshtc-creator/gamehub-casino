import { NextResponse } from 'next/server'
import { createRound } from '@/lib/dragonTowerStore'
import { DRAGON_CONFIG, DragonDifficulty } from '@/lib/dragonTowerDb'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { betAmount, difficulty, clientSeed } = body

    if (!betAmount || betAmount < 1) {
      return NextResponse.json({ error: 'Invalid bet amount. Minimum bet is ₹1.' }, { status: 400 })
    }

    const diffKey = (difficulty || 'MEDIUM') as DragonDifficulty
    if (!DRAGON_CONFIG[diffKey]) {
      return NextResponse.json({ error: 'Invalid difficulty level.' }, { status: 400 })
    }

    // Create Provably Fair Game Round
    const userId = 'user_guest'
    const { round } = createRound(userId, betAmount, diffKey, clientSeed)
    const config = DRAGON_CONFIG[diffKey]

    return NextResponse.json({
      success: true,
      roundId: round.id,
      serverSeedHash: round.serverSeedHash,
      clientSeed: round.clientSeed,
      nonce: round.nonce,
      currentFloor: round.currentFloor,
      difficulty: round.difficulty,
      betAmount: round.betAmount,
      totalTiles: config.totalTiles,
      safeTiles: config.safeTiles,
      dragonTiles: config.dragonTiles,
      winChance: config.winChance,
      multipliers: config.multipliers
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to start Dragon Tower round' }, { status: 500 })
  }
}
