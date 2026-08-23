import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const body = await req.json()
    const { amount, game } = body

    if (amount < 0) {
      return NextResponse.json({ error: 'Valid credit amount required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      transaction: {
        id: `cred-${Date.now()}`,
        userId: session?.user?.id || 'demo-user',
        game: game || 'GAME',
        type: 'CREDIT',
        amount,
        timestamp: new Date().toISOString(),
        status: 'COMPLETED'
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Credit failed' }, { status: 500 })
  }
}
