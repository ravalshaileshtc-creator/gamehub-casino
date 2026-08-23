import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { TwoFactorService } from '@/services/twofa.service'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token, secret } = await req.json()

    if (!token || !secret) {
      return NextResponse.json({ error: 'Token and secret required' }, { status: 400 })
    }

    const isValid = await TwoFactorService.verifyToken(token, secret)

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    const backupCodes = await TwoFactorService.enable2FA(session.user.id, secret)

    return NextResponse.json({
      success: true,
      message: '2FA Enabled successfully',
      backupCodes
    })
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json({ error: 'Failed to verify 2FA' }, { status: 500 })
  }
}
