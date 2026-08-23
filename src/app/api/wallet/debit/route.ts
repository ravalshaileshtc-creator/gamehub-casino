import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const { amount, game } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid debit amount required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: `deb-${Date.now()}`,
        userId: session?.user?.id || 'demo-user',
        game: game || 'GAME',
        type: 'DEBIT',
        amount,
        timestamp: new Date().toISOString(),
        status: 'COMPLETED'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Debit failed' }, { status: 500 })
  }
}
