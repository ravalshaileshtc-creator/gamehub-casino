import { NextResponse } from 'next/server'
import { runInitializations } from '@/lib/init'

/**
 * GET /api/admin/init
 * Initialize game settings and system config (run once)
 */
export async function GET() {
  try {
    // In production, add admin authentication here
    // For now, this should be called once during deployment

    await runInitializations()

    return NextResponse.json({
      success: true,
      message: 'System initialized successfully',
    })
  } catch (error) {
    console.error('Initialization error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to initialize system' },
      { status: 500 }
    )
  }
}


export const dynamic = "force-dynamic";
