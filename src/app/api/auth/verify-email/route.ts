import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'

const verifySchema = z.object({
  token: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = verifySchema.parse(body)

    // Find verification token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: 'EMAIL_VERIFY',
      },
    })

    if (!verificationToken) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired verification token',
      }, { status: 400 })
    }

    // Check if token expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      })

      return NextResponse.json({
        success: false,
        error: 'Verification token has expired. Please request a new one.',
      }, { status: 400 })
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    })

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 })
    }

    if (user.emailVerified) {
      // Already verified, delete token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      })

      return NextResponse.json({
        success: false,
        error: 'Email already verified',
      }, { status: 400 })
    }

    // Verify email
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    })

    // Delete used token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    })

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now login.',
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to verify email',
    }, { status: 500 })
  }
}
