import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // For now, return mock sessions
    // In production,  you'd track actual sessions in database
    const sessions = [
      {
        id: '1',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '192.168.1.1',
        lastActive: new Date().toISOString(),
        current: true,
      },
    ]

    return NextResponse.json({
      success: true,
      sessions,
    })
  } catch (error) {
    console.error('Sessions fetch error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const all = searchParams.get('all')

    // In production, implement actual session management
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: all ? 'All sessions logged out' : 'Session logged out',
    })
  } catch (error) {
    console.error('Session logout error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}


export const dynamic = "force-dynamic";
