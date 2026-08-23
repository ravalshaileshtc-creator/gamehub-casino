import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { z } from 'zod'
import { TwoFactorService } from '@/services/twofa.service'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const disableSchema = z.object({
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { password } = disableSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: 'Incorrect password',
      }, { status: 400 })
    }

    // Disable 2FA
    await TwoFactorService.disable2FA(user.id)

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: '2FA_DISABLED',
        resource: 'USER',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || '',
        details: 'Two-factor authentication disabled',
      },
    })

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    })
  } catch (error) {
    console.error('2FA disable error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to disable 2FA',
    }, { status: 500 })
  }
}
