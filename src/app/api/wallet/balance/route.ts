import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { WalletService } from '@/services/wallet.service'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const wallet = await WalletService.getWallet(session.user.id)
      if (wallet) {
        return NextResponse.json({ success: true, wallet })
      }
    } catch (e) {
      console.log('[Wallet Balance API] DB bypass fallback')
    }

    // Default starting balance for users is ZERO (0.00)
    return NextResponse.json({
      success: true,
      wallet: {
        mainBalance: 0.0,
        bonusBalance: 0.0,
        totalBalance: 0.0
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: true,
      wallet: { mainBalance: 0.0, bonusBalance: 0.0, totalBalance: 0.0 }
    })
  }
}

export const dynamic = "force-dynamic";
