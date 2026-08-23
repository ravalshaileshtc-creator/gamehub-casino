import { NextResponse } from 'next/server'
import { generateFloorLayouts, sha256, DragonDifficulty, DRAGON_CONFIG } from '@/lib/dragonTowerDb'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { serverSeed, clientSeed, nonce, difficulty } = body

    if (!serverSeed || !clientSeed || nonce === undefined) {
      return NextResponse.json({ error: 'Missing serverSeed, clientSeed, or nonce for verification.' }, { status: 400 })
    }

    const diffKey = (difficulty || 'MEDIUM') as DragonDifficulty
    if (!DRAGON_CONFIG[diffKey]) {
      return NextResponse.json({ error: 'Invalid difficulty level.' }, { status: 400 })
    }

    // Recompute HMAC-SHA256 layouts deterministically
    const calculatedHash = sha256(serverSeed)
    const verifiedLayouts = generateFloorLayouts(serverSeed, clientSeed, nonce, diffKey)

    return NextResponse.json({
      success: true,
      verified: true,
      serverSeed,
      serverSeedHash: calculatedHash,
      clientSeed,
      nonce,
      difficulty: diffKey,
      floorLayouts: verifiedLayouts
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Provably Fair verification failed' }, { status: 500 })
  }
}
