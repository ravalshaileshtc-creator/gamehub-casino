import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { sendEmail, getVerificationEmailHtml } from '@/lib/email'
import crypto from 'crypto'

const emailSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email } = emailSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerified: true },
    })

    if (!user) {
      // Don't reveal if email exists
      return NextResponse.json({
        success: true,
        message: 'If the email exists, a verification link has been sent',
      })
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: false,
        error: 'Email already verified',
      }, { status: 400 })
    }

    // Generate verification token (24-hour expiry)
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store token in VerificationToken model
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        type: 'EMAIL_VERIFY',
        expires,
      },
    })

    // Send verification email
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const emailHtml = getVerificationEmailHtml(user.name || 'User', token, baseUrl)

    await sendEmail({
      to: email,
      subject: '🎰 Verify Your Email - Casino Platform',
      html: emailHtml,
    })

    return NextResponse.json({
      success: true,
      message: 'Verification email sent',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send verification email',
    }, { status: 500 })
  }
}
