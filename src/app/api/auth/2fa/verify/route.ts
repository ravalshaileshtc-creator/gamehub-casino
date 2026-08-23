import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { TwoFactorService } from '@/services/twofa.service'
import prisma from '@/lib/prisma'

const verifySchema = z.object({
  token: z.string().length(6),
  secret: z.string(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { token, secret } = verifySchema.parse(body)

    // Verify the token
    const isValid = await TwoFactorService.verifyToken(token, secret)

    if (!isValid) {
      return NextResponse.json({
        success: false,
        error: 'Invalid verification code',
      }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Enable 2FA and get backup codes
    const backupCodes = await TwoFactorService.enable2FA(user.id, secret)

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: '2FA_ENABLED',
        resource: 'USER',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || '',
        details: 'Two-factor authentication enabled',
      },
    })

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully',
      backupCodes,
    })
  } catch (error) {
    console.error('2FA verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to verify 2FA',
    }, { status: 500 })
  }
}
