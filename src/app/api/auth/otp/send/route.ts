
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString()
    const expires = Date.now() + 10 * 60 * 1000 // 10 minutes from now

    // 2. Store in Database (Repurposing transactionPassword field)
    // Format: "OTP:EXPIRY_TIMESTAMP"
    const otpString = `${otp}:${expires}`

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        transactionPassword: otpString
      }
    })

    // 3. Send Email
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV OTP] To: ${session.user.email}, Code: ${otp}`)
    }

    await sendEmail({
      to: session.user.email,
      subject: 'Withdrawal Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #f97316;">Withdrawal Verification</h2>
          <p>You requested a withdrawal from your account.</p>
          <p>Please use the following code to complete your request:</p>
          <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</span>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this, please contact support immediately.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: 'OTP sent to email' })

  } catch (error) {
    console.error('Send OTP error:', error)
    return NextResponse.json({ error: (error instanceof Error ? error.message : 'An error occurred') || 'Failed to send OTP' }, { status: 500 })
  }
}
