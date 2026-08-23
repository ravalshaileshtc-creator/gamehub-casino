import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { sendEmail, getPasswordResetEmailHtml } from '@/lib/email'
import crypto from 'crypto'

const forgotSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = forgotSchema.parse(body)

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    })

    // Don't reveal if email exists (security)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent',
      })
    }

    // Generate reset token (1-hour expiry)
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store token in VerificationToken model
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        type: 'PASSWORD_RESET',
        expires,
      },
    })

    // Send password reset email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const emailHtml = getPasswordResetEmailHtml(user.name || 'User', token, baseUrl)

    await sendEmail({
      to: email,
      subject: '🔐 Reset Your Password - Casino Platform',
      html: emailHtml,
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET_REQUESTED',
        resource: 'USER',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || '',
        details: 'Password reset email sent',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process password reset request',
    }, { status: 500 })
  }
}
