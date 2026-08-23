import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = resetSchema.parse(body)

    // Find reset token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        token,
        type: 'PASSWORD_RESET',
      },
    })

    if (!verificationToken) {
      return NextResponse.json({
        success: false,
        error: 'Invalid or expired reset token',
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
        error: 'Reset token has expired. Please request a new one.',
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

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Delete used token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        resource: 'USER',
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || '',
        details: 'Password changed via reset link',
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.',
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to reset password',
    }, { status: 500 })
  }
}
