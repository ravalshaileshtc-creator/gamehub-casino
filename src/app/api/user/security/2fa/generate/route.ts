import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { TwoFactorService } from '@/services/twofa.service'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const secret = TwoFactorService.generateSecret()
    const qrCodeUrl = await TwoFactorService.generateQRCode(session.user.email || 'User', secret)

    return NextResponse.json({
      success: true,
      secret,
      qrCodeUrl
    })
  } catch (error) {
    console.error('2FA generate error:', error)
    return NextResponse.json({ error: 'Failed to generate 2FA' }, { status: 500 })
  }
}
