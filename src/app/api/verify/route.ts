import { NextRequest, NextResponse } from 'next/server'
import { ProvablyFairService } from '@/services/provably-fair.service'

/**
 * POST /api/verify
 * Verify provably fair game result (public endpoint)
 */
export async function POST(req: NextRequest) {
  try {
    const { serverSeed, clientSeed, nonce, claimedOutcome } = await req.json()

    if (!serverSeed || !clientSeed || nonce === undefined || claimedOutcome === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const verification = ProvablyFairService.verifyOutcome(
      serverSeed,
      clientSeed,
      nonce,
      claimedOutcome
    )

    return NextResponse.json({
      success: true,
      isValid: verification,
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to verify outcome' },
      { status: 500 }
    )
  }
}
