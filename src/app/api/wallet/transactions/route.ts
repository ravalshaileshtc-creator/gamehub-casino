import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { WalletService } from '@/services/wallet.service'

/**
 * GET /api/wallet/transactions
 * Get user's transaction history
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = parseInt(searchParams.get('skip') || '0')

    const transactions = await WalletService.getTransactions(
      session.user.id,
      limit,
      skip
    )

    return NextResponse.json({ success: true, transactions })
  } catch (error) {
    console.error('Transaction history error:', error)
    return NextResponse.json(
      { error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to get transactions' },
      { status: 500 }
    )
  }
}


export const dynamic = "force-dynamic";
