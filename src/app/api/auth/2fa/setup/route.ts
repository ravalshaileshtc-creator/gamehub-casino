import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { TwoFactorService } from '@/services/twofa.service'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate new secret
    const secret = TwoFactorService.generateSecret()

    // Generate QR code
    const qrCode = await TwoFactorService.generateQRCode(session.user.email, secret)

    return NextResponse.json({
      success: true,
      secret,
      qrCode,
      message: 'Scan this QR code with your authenticator app',
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to setup 2FA',
    }, { status: 500 })
  }
}
